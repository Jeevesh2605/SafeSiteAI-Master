import json
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
from urllib.parse import urlparse, unquote_plus # <-- Fixed typo: was 'uxnquote_plus'

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'SafeSiteOutlierEvents')
table = dynamodb.Table(TABLE_NAME)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def parse_s3_uri(s3_uri: str):
    """Parses an S3 URI (s3://bucket/key) into bucket and key"""
    try:
        parsed_uri = urlparse(s3_uri)
        bucket = parsed_uri.netloc
        key = unquote_plus(parsed_uri.path.lstrip('/'))
        if not bucket or not key:
            raise ValueError(f"Invalid S3 URI: {s3_uri}")
        return bucket, key
    except Exception as e:
        print(f"Error parsing S3 URI {s3_uri}: {e}")
        return None, None

def regenerate_presigned_url(bucket, image_key, expiration=3600):
    """Regenerate presigned URL"""
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': image_key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        print(f"Error generating presigned URL for s3://{bucket}/{image_key}: {e}")
        return None


def lambda_handler(event, context):
    """
    API endpoint to fetch outlier events from DynamoDB
    """
    
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',  # Change to your frontend domain in production
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 50))
        video_name = params.get('videoName')
        start_date = params.get('startDate')
        end_date = params.get('endDate')
        
        print(f"Fetching outliers - limit: {limit}, video: {video_name}")
        
        scan_kwargs = {'Limit': limit}
        filter_expression = None
        
        if video_name:
            filter_expression = Attr('videoName').eq(video_name)
        
        if start_date:
            start_filter = Attr('timestamp').gte(int(start_date))
            filter_expression = start_filter if not filter_expression else filter_expression & start_filter
        
        if end_date:
            end_filter = Attr('timestamp').lte(int(end_date))
            filter_expression = end_filter if not filter_expression else filter_expression & end_filter
        
        if filter_expression:
            scan_kwargs['FilterExpression'] = filter_expression
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        # --- START OF FIX ---
        # Regenerate presigned URLs for *both* annotated and original images
        for item in items:
            
            # 1. Try to get the ANNOTATED image URL
            annotated_s3_uri = item.get('annotated_frame_s3_uri')
            if annotated_s3_uri:
                annotated_bucket, annotated_key = parse_s3_uri(annotated_s3_uri)
                if annotated_bucket and annotated_key:
                    new_annotated_url = regenerate_presigned_url(annotated_bucket, annotated_key)
                    if new_annotated_url:
                        # This is the field your React code looks for!
                        item['presignedAnnotatedImageUrl'] = new_annotated_url
            
            # 2. Get the ORIGINAL image URL (as a fallback)
            s3_bucket = item.get('s3Bucket')
            s3_image_key = item.get('s3ImageKey')
            
            if s3_bucket and s3_image_key:
                new_url = regenerate_presigned_url(s3_bucket, s3_image_key)
                if new_url:
                    item['presignedImageUrl'] = new_url
        # --- END OF FIX ---
        
        # Sort by timestamp (descending - newest first)
        items.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'count': len(items),
                'events': items
            }, cls=DecimalEncoder)
        }
        
    except Exception as e:
        print(f"Error fetching outliers: {e}")
        import traceback
        print(traceback.format_exc())
        
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }