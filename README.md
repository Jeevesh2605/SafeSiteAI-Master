# 🛡️ SafeSite AI: Cloud-Based Industrial Safety Auditor

SafeSite AI is an intelligent, automated safety auditing system designed for industrial environments. By leveraging computer vision and real-time monitoring, the system detects safety violations, ensures compliance, and mitigates workplace hazards. 

This repository serves as the master monorepo, housing the entire system architecture across the frontend, backend, cloud infrastructure, and the core machine learning model.

## 🏗️ System Architecture & Repository Structure

To maintain a streamlined CI/CD pipeline and full-stack visibility, this project is structured as a monorepo. 

* **`/frontend`** - The user interface for the auditing dashboard, providing real-time analytics and alerts.
* **`/backend`** - The core API handling data routing, user authentication, and system state.
* **`/cloud`** - Infrastructure-as-Code (IaC) and configuration files for scalable deployment and hosting.
* **`/ml-model`** - The deep learning object detection model (utilizing YOLOv8) responsible for identifying safety gear and hazards from video feeds.

## 🚀 Key Features

* **Real-Time Hazard Detection:** Processes live video feeds to identify missing personal protective equipment (PPE) and unsafe zones.
* **Scalable Cloud Infrastructure:** Built to handle high-bandwidth video processing and continuous monitoring without latency.
* **Automated Alerting:** Instantly notifies safety officers of critical violations via the dashboard.
* **Unified Deployment:** Containerized microservices architecture for seamless updates and scaling.

## 👥 Team & Contributors

SafeSite AI was built by a dedicated four-person team, with responsibilities divided across specialized domains to ensure a robust, scalable product:

* **Jeevesh Chaurasiya** - *Full-Stack Architecture, Cloud Computing & DevOps*
* **Riya Bajpai** - *Machine Learning & Computer Vision*
* **Mohd. Nazeeb Mansoori** - *Backend Development*
* **farhaan Ansari** - *Frontend Development*
