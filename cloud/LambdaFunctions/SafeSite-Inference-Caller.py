import json
import os
import boto3
import base64
import re
import io
from urllib.parse import urlparse, unquote_plus
from pathlib import PurePosixPath
from PIL import Image, ImageDraw, ImageFont

# --- Clients ---
s3_client = boto3.client('s3')
sm_runtime = boto3.client('sagemaker-runtime')

# --- Configuration from Environment Variables ---
ENDPOINT_NAME = os.environ.get('SAGEMAKER_ENDPOINT_NAME')
OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET') # Bucket for JSON results
ANNOTATED_BUCKET = os.environ.get('ANNOTATED_BUCKET', OUTPUT_BUCKET) # Bucket for annotated images
OUTPUT_PREFIX = os.environ.get('OUTPUT_PREFIX', 'inference-results')
ANNOTATED_PREFIX = os.environ.get('ANNOTATED_PREFIX', 'annotated-frames')

def extract_frame_number(frame_file: str) -> int:
    """
    Extracts the first sequence of digits from a filename.
    """
    try:
        match = re.search(r'(\d+)', frame_file)
        if match:
            return int(match.group(1))
        else:
            print(f"Warning: No digits found in {frame_file}. Defaulting to 0.")
            return 0
    except Exception as e:
        print(f"Warning: Could not parse frame number from {frame_file} due to {e}. Defaulting to 0.")
        return 0

def draw_boxes(image_bytes, detections):
    """
    Draws bounding boxes and labels on an image.
    Returns the image as bytes in JPEG format.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        draw = ImageDraw.Draw(image)
        font = ImageFont.load_default()

        for det in detections:
            # --- THIS IS THE FIX ---
            # The model sends 'bbox', not 'box'
            box = det.get('bbox') 
            # --- END OF FIX ---
            
            label = det.get('label', 'unknown') # <-- Use 'label' from the log
            confidence = det.get('confidence', 0)
            
            if not box or len(box) != 4:
                print(f"Skipping detection with invalid box (box: {box}): {det}")
                continue

            # Define color
            color = "red"
            if "helmet" in label:
                color = "yellow"
            elif "suit" in label:
                color = "orange"

            # Draw rectangle
            draw.rectangle(box, outline=color, width=3)
            
            # Draw label background
            text = f"{label} ({(confidence * 100):.1f}%)"
            
            # Check if textbbox method is available, fallback if not
            if hasattr(draw, 'textbbox'):
              text_bbox = draw.textbbox((box[0], box[1]), text, font=font)
              text_bbox_list = [text_bbox[0], text_bbox[1], text_bbox[2], text_bbox[3]]
            else:
              # Fallback for older Pillow versions
              text_size = font.getsize(text)
              text_bbox_list = [box[0], box[1], box[0] + text_size[0], box[1] + text_size[1]]

            # Add small padding
            text_bbox_list[1] = max(0, text_bbox_list[1] - 2) # Move text up
            text_bbox_list[2] += 4 # Padding right
            text_bbox_list[3] += 2 # Padding bottom
            
            draw.rectangle(text_bbox_list, fill=color)
            draw.text((box[0] + 2, text_bbox_list[1]), text, fill="black", font=font)

        output_buffer = io.BytesIO()
        image.save(output_buffer, format="JPEG")
        return output_buffer.getvalue()

    except Exception as e:
        print(f"Error drawing boxes: {e}")
        return image_bytes

def lambda_handler(event, context):
    """
    Process frames from SQS, run inference, draw boxes, and save results.
    """
    if not ENDPOINT_NAME or not OUTPUT_BUCKET:
        raise ValueError("Missing env vars: SAGEMAKER_ENDPOINT_NAME and/or OUTPUT_BUCKET")
    
    print(f"Received {len(event['Records'])} records from SQS.")
    
    failed_messages = []
    processed_count = 0
    
    for record in event['Records']:
        frame_file = "unknown"
        original_video_key = "unknown-video"
        
        try:
            message_body = json.loads(record['body'])
            frame_s3_path = message_body['s3_uri']
            original_video_key = message_body.get('original_video_key', 'unknown-video')
            frame_file = message_body.get('frame_file', 'unknown-frame.jpg')
            
            print(f"Processing: {frame_file} from {os.path.basename(original_video_key)}")
            
            parsed_uri = urlparse(frame_s3_path)
            bucket = parsed_uri.netloc
            key = unquote_plus(parsed_uri.path.lstrip('/'))
            
            if not bucket or not key:
                raise ValueError(f"Invalid S3 URI: {frame_s3_path}")
            
            print(f"  → Downloading image: s3://{bucket}/{key}")
            response = s3_client.get_object(Bucket=bucket, Key=key)
            image_bytes = response['Body'].read()
            
            b64_image = base64.b64encode(image_bytes).decode('utf-8')
            sm_payload = json.dumps({"image": b64_image})
            
            print(f"  → Calling SageMaker endpoint...")
            sm_response = sm_runtime.invoke_endpoint(
                EndpointName=ENDPOINT_NAME,
                ContentType='application/json',
                Body=sm_payload
            )
            
            result_body = sm_response['Body'].read().decode('utf-8')
            detection_results = json.loads(result_body)
            
            print(f"  → SM Raw Detections: {json.dumps(detection_results)}")
            
            detections = detection_results.get('detections', [])
            num_detections = len(detections)
            print(f"  → Received {num_detections} detection(s)")
            
            annotated_image_bytes = draw_boxes(image_bytes, detections)
            
            original_video_name = os.path.basename(original_video_key)
            # Ensure ANNOTATED_PREFIX is clean
            clean_annotated_prefix = ANNOTATED_PREFIX.strip('/')
            
            annotated_key_parts = [clean_annotated_prefix, original_video_name, frame_file] if clean_annotated_prefix else [original_video_name, frame_file]
            annotated_key = str(PurePosixPath(*annotated_key_parts))
            
            print(f"  → Attempting to save annotated image to: s3://{ANNOTATED_BUCKET}/{annotated_key}")
            s3_client.put_object(
                Body=annotated_image_bytes,
                Bucket=ANNOTATED_BUCKET,
                Key=annotated_key,
                ContentType='image/jpeg'
            )
            annotated_s3_uri = f"s3://{ANNOTATED_BUCKET}/{annotated_key}"
            print(f"  → Saved annotated image to: {annotated_s3_uri}")

            frame_number = extract_frame_number(frame_file)
            
            full_response_payload = {
                "frame_id": f"{original_video_name}_frame_{frame_number:05d}",
                "video_id": original_video_name,
                "frame_number": frame_number,
                "detections": detections,
                "processed_frame_url": "N/A (Processed by SageMaker)",
                "annotated_frame_s3_uri": annotated_s3_uri,
                "outlier_detected": False,
                "outlier_reason": None
            }
            
            frame_json = frame_file.replace('.jpg', '.json').replace('.png', '.json')
            
            clean_output_prefix = OUTPUT_PREFIX.strip('/')
            path_parts = [clean_output_prefix, original_video_name, frame_json] if clean_output_prefix else [original_video_name, frame_json]
            result_key = str(PurePosixPath(*path_parts))
            
            print(f"  → Attempting to save JSON to: s3://{OUTPUT_BUCKET}/{result_key}")
            s3_client.put_object(
                Body=json.dumps(full_response_payload),
                Bucket=OUTPUT_BUCKET,
                Key=result_key,
                ContentType='application/json'
            )
            
            print(f"  ✓ Saved JSON to: s3://{OUTPUT_BUCKET}/{result_key}")
            processed_count += 1
            
        except Exception as e:
            error_msg = f"✗ ERROR processing {frame_file} from {original_video_key}: {str(e)}"
            print(error_msg)
            failed_messages.append({'itemIdentifier': record['messageId']})
    
    print(f"\n{'='*60}")
    print(f"Processed: {processed_count}/{len(event['Records'])} frames")
    print(f"Failed: {len(failed_messages)} frames")
    print(f"{'='*60}")
    
    if failed_messages:
        return {'batchItemFailures': failed_messages}
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'All frames processed successfully', 'processed': processed_count})
    }
