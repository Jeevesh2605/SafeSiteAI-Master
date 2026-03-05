# SafeSite – AI-Powered Cloud Auditing System (AWS + ML)
SafeSite is a cloud-based auditing and anomaly-detection platform built using AWS services + ML + a custom dashboard UI.
The system collects cloud events, processes them through a scalable audit pipeline, and generates real-time insights using an ML model deployed on SageMaker.

# 🚀 Tech Stack
AWS: SQS, Lambda, DynamoDB, S3, SageMaker
Frontend: React (SafeSite Dashboard)
Backend: Node.js / Python Lambda
Database: DynamoDB
ML Model: SageMaker hosted endpoint

# 🏗️ System Architecture
Complete event flow:
Frontend → SQS → Lambda → DynamoDB → S3 → SageMaker → Dashboard Alerts

# ⚡ Key Features
Real-time audit event handling using SQS → Lambda pipeline
Automated anomaly detection using a SageMaker ML model
Secure storage of audit logs in DynamoDB + S3
Custom React dashboard for real-time monitoring
End-to-end cloud workflow designed for scalability

# 🎥 Demo Video
(Silent UI + AWS pipeline walkthrough)
👉 Demo: https://drive.google.com/file/d/1yXcYjuNnaZs2AEMcruNyX15l1NYxiaZB/view?usp=share_link
