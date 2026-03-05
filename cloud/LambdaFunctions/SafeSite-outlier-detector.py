import json
import os
import re
import boto3
from datetime import datetime
from urllib.parse import unquote_plus, urlparse
from decimal import Decimal

# --- Clients ---
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')

# --- Configuration ---
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'SafeSiteOutlierEvents')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
table = dynamodb.Table(TABLE_NAME)

# --- MODIFIED: Read outlier classes from environment variable for flexibility ---
# Example: "tampering,intrusion,no_helmet,no_suit"
# This is perfect for your TruMeasure project, as you can set it to "tampering"
OUTLIER_CLASSES_STR = os.environ.get(
    'OUTLIER_CLASSES', 
    'tampering,intrusion,unauthorized_access,no_helmet,no_suit'
)
OUTLIER_CLASSES = {
    cls.strip().lower() for cls in OUTLIER_CLASSES_STR.split(',') if cls.strip()
}
# --- END MODIFICATION ---

print(f"Monitoring for outlier classes: {OUTLIER_CLASSES}")
if SNS_TOPIC_ARN:
    print(f"SNS notifications enabled: {SNS_TOPIC_ARN}")
else:
    print("⚠️  SNS notifications DISABLED - SNS_TOPIC_ARN not set")


def floats_to_decimals(obj):
    """
    Recursively converts all float values in a dict or list to Decimals.
    Required because DynamoDB doesn't support Python float type.
    """
    if isinstance(obj, list):
        return [floats_to_decimals(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj


def extract_frame_number(frame_filename):
    """
    Extract frame number from filename using regex.
    Handles: frame_00001.json, frame-00001.json, frame00001.json, etc.
    """
    match = re.search(r'frame[_-]?(\d+)', frame_filename, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def lambda_handler(event, context):
    """
    Process inference results and detect outlier events.
    Triggered by S3 PUT events on inference-results folder.
    """
    print(f"Received {len(event.get('Records', []))} S3 event(s)")
    
    processed_count = 0
    outlier_count = 0
    error_count = 0

    for record in event.get('Records', []):
        object_key = None
        
        try:
            # Extract S3 event details
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])

            print(f"\n{'='*60}")
            print(f"Processing: s3://{bucket_name}/{object_key}")

            # Filter: Only process inference results
            if not object_key.startswith('inference-results/'):
                print("⊘ Skipping: Not in inference-results folder")
                continue
                
            if not object_key.endswith('.json'):
                print("⊘ Skipping: Not a JSON file")
                continue

            # Read inference results from S3
            response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
            inference_data = json.loads(response['Body'].read().decode('utf-8'))
            
            print(f"DEBUG: Inference data structure: {json.dumps(inference_data, indent=2)[:500]}...")

            # --- 
            # FIX #1: The API returns 'detections', not 'predictions'
            # ---
            predictions = inference_data.get('detections', []) 
            
            if not isinstance(predictions, list):
                print(f"⚠️  WARNING: 'detections' is not a list: {type(predictions)}")
                predictions = []

            # Parse S3 key for metadata
            path_parts = object_key.split('/')
            
            if len(path_parts) < 3:
                print(f"✗ Invalid S3 key structure. Expected at least 3 parts, got {len(path_parts)}")
                error_count += 1
                continue
            
            # ---
            # Use 'video_id' and 'frame_number' from the JSON if available,
            # as it's more reliable than parsing the filename.
            # ---
            video_name = inference_data.get('video_id', path_parts[-2])
            frame_filename = path_parts[-1]
            frame_number = inference_data.get('frame_number', extract_frame_number(frame_filename))
            
            if frame_number is None:
                # Fallback if 'frame_number' isn't in JSON and filename parsing fails
                print(f"✗ Could not determine frame number from JSON or filename: {frame_filename}")
                error_count += 1
                continue

            print(f"→ Video: {video_name}")
            print(f"→ Frame: {frame_number}")
            print(f"→ Total detections: {len(predictions)}")

            # Check for outliers
            detected_outliers = []

            for idx, prediction in enumerate(predictions):
                # ---
                # FIX #2: The API returns 'label', not 'class' or 'class_name'
                # ---
                class_label = prediction.get('label')
                
                if not class_label:
                    print(f"  WARNING: Prediction {idx} missing 'label' field: {prediction}")
                    continue
                
                # Normalize to lowercase for comparison
                class_label_lower = str(class_label).lower()
                
                print(f"  → Checking class: '{class_label}' (normalized: '{class_label_lower}')")
                
                if class_label_lower in OUTLIER_CLASSES:
                    confidence = prediction.get('confidence', 0.0)
                    
                    # ---
                    # FIX #3: The API returns 'bbox', not 'box'
                    # ---
                    box = prediction.get('bbox', []) # Changed from 'box' and {} to []
                    
                    detected_outliers.append({
                        'class': class_label,  # Store original case
                        'confidence': confidence,
                        'box': box
                    })
                    
                    print(f"    ⚠️  OUTLIER DETECTED: {class_label} (confidence: {confidence:.2f})")

            # Save outliers to DynamoDB
            if detected_outliers:
                print(f"\n🚨 OUTLIER EVENT: {len(detected_outliers)} anomaly(ies) detected!")
                
                event_id = f"{video_name}_{frame_filename.replace('.json', '')}"
                current_timestamp = datetime.utcnow()
                
                # --- Generate presigned URL for the frame image ---
                # Use the processed_frame_url from the API if it exists, it's easier!
                presigned_image_url = inference_data.get('processed_frame_url')
                frame_image_key = None
                
                if not presigned_image_url or presigned_image_url == "N/A (Processed by SageMaker)":
                    # Fallback: manually generate presigned URL for the *original* frame
                    print("  → No 'processed_frame_url' in JSON, generating presigned URL for original frame.")
                    frame_image_key = object_key.replace('inference-results/', 'extracted-frames/').replace('.json', '.jpg')
                    try:
                        presigned_image_url = s3_client.generate_presigned_url(
                            'get_object',
                            Params={'Bucket': bucket_name, 'Key': frame_image_key},
                            ExpiresIn=86400  # URL valid for 24 hours
                        )
                        print(f"✓ Generated presigned URL for {frame_image_key}")
                    except Exception as e:
                        print(f"✗ ERROR generating presigned URL for {frame_image_key}: {e}")
                        presigned_image_url = f"Error generating URL: {e}"
                else:
                    print(f"✓ Using 'processed_frame_url' from API response: {presigned_image_url}")
                    # Try to parse the image key from the URL
                    try:
                        frame_image_key = unquote_plus(urlparse(presigned_image_url).path.lstrip('/'))
                    except Exception:
                        frame_image_key = "Unknown (from processed_frame_url)"

                # --- END IMAGE REFERENCE MODIFICATION ---
                
                # Create item for DynamoDB
                item_to_save = {
                    'video_frame_timestamp': event_id,  # Partition Key
                    'timestamp': int(current_timestamp.timestamp()),  # Sort Key
                    'videoName': video_name,
                    'frameNumber': frame_number,
                    's3Bucket': bucket_name,
                    's3Key': object_key,
                    's3ImageKey': frame_image_key,
                    'presignedImageUrl': presigned_image_url,
                    'outliers': detected_outliers,
                    'totalDetections': len(predictions),
                    'outlierCount': len(detected_outliers),
                    'timestampISO': current_timestamp.isoformat() + 'Z'
                }

                # Convert floats to Decimals for DynamoDB
                item_with_decimals = floats_to_decimals(item_to_save)
                
                # Save to DynamoDB
                table.put_item(Item=item_with_decimals)
                print(f"✅ Outlier event saved to DynamoDB: {event_id}")
                
                # --- Send SNS Notification ---
                if SNS_TOPIC_ARN:
                    try:
                        # Create notification message
                        outlier_summary = ', '.join([
                            f"{o['class']} ({o['confidence']:.0%})" 
                            for o in detected_outliers[:3]
                        ])
                        if len(detected_outliers) > 3:
                            outlier_summary += f" +{len(detected_outliers) - 3} more"
                        
                        message = f"""🚨 SAFETY ALERT: Outlier Detected

Video: {video_name}
Frame: {frame_number}
Time: {current_timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC

Detected Issues ({len(detected_outliers)}):
{outlier_summary}

Total Detections: {len(predictions)}

View Image: {presigned_image_url if presigned_image_url and not presigned_image_url.startswith('Error') else 'Image unavailable'}

Event ID: {event_id}
"""
                        
                        # Prepare SNS message with different formats for different protocols
                        sns_message = {
                            'default': message,
                            'email': message,
                            'sms': f"SafeSite Alert: {len(detected_outliers)} issue(s) in {video_name} frame {frame_number}. {outlier_summary}"
                        }
                        
                        # Send notification
                        response = sns_client.publish(
                            TopicArn=SNS_TOPIC_ARN,
                            Message=json.dumps(sns_message),
                            MessageStructure='json',
                            Subject=f'🚨 SafeSite Alert: {len(detected_outliers)} Safety Issue(s) Detected',
                            MessageAttributes={
                                'eventType': {
                                    'DataType': 'String',
                                    'StringValue': 'outlier_detection'
                                },
                                'severity': {
                                    'DataType': 'String',
                                    'StringValue': 'high' if len(detected_outliers) > 2 else 'medium'
                                },
                                'videoName': {
                                    'DataType': 'String',
                                    'StringValue': video_name
                                }
                            }
                        )
                        
                        print(f"✅ SNS notification sent: MessageId={response['MessageId']}")
                        
                    except Exception as sns_error:
                        print(f"⚠️  WARNING: Failed to send SNS notification: {sns_error}")
                        import traceback
                        print(traceback.format_exc())
                        # Don't fail the entire function if notification fails
                else:
                    print("⊘ SNS notification skipped - SNS_TOPIC_ARN not configured")
                
                outlier_count += 1
            else:
                print("✓ No outliers detected")

            processed_count += 1

        except KeyError as e:
            print(f"✗ ERROR: Missing expected field in event structure: {e}")
            print(f"  Event record: {json.dumps(record, default=str)[:500]}")
            error_count += 1
            
        except json.JSONDecodeError as e:
            print(f"✗ ERROR: Invalid JSON in S3 object {object_key}: {e}")
            error_count += 1
            
        except Exception as e:
            print(f"✗ ERROR: Unexpected error processing {object_key}: {type(e).__name__}: {e}")
            import traceback
            print(traceback.format_exc())
            error_count += 1

    # Summary
    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"  Processed: {processed_count}")
    print(f"  Outliers detected: {outlier_count}")
    print(f"  Errors: {error_count}")
    print(f"{'='*60}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Outlier detection complete',
            'processed': processed_count,
            'outliersFound': outlier_count,
            'errors': error_count
        })
    }
