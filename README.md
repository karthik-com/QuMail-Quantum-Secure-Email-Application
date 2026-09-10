# QuMail – Quantum Secure Email System

## 1. Project Overview

* QuMail is a secure email communication system designed to protect email content using modern cryptographic techniques and quantum-key-generation concepts.
* The system combines Quantum Key Distribution (QKD) concepts, Qiskit, IBM Quantum, AES-256-GCM encryption, OTP authentication, AWS SNS, and MongoDB.
* The main objective is to provide secure email communication while demonstrating how quantum computing concepts can be integrated with conventional cryptographic techniques.
* The application provides separate interfaces for registered users and administrators.
* Users can compose, send, receive, read, star, delete, restore, and manage emails.
* Sensitive email content is encrypted before being stored in the database.
* OTP verification is used as an additional security layer before accessing protected email content.
* MongoDB is used for storing user and email-related information.

## 2. Main Objectives

* To develop a secure email communication platform.
* To demonstrate the application of Quantum Key Distribution concepts in email security.
* To implement the BB84 protocol using Qiskit.
* To integrate IBM Quantum infrastructure for quantum circuit execution where applicable.
* To use the generated shared key for secure email encryption.
* To implement AES-256-GCM for authenticated email encryption.
* To provide confidentiality and integrity for stored email content.
* To implement OTP-based authentication for accessing protected emails.
* To use AWS SNS for secure OTP delivery through SMS.
* To securely store application data using MongoDB.
* To provide role-based functionality for users and administrators.

## 3. Technologies Used

### Frontend

* React
* Vite
* HTML
* CSS
* JavaScript

### Backend

* Python
* Django
* Django REST Framework
* Django Channels
* Daphne
* JWT Authentication

### Database

* MongoDB
* MongoDB Atlas
* Django MongoDB Backend

### Cryptography

* AES-256-GCM
* Authentication Tag
* Initialization Vector
* Quantum Key Distribution concepts
* BB84 Protocol

### Quantum Computing

* Qiskit
* Quantum Circuits
* IBM Quantum

### Cloud Services

* AWS Simple Notification Service
* AWS SNS SMS API

## 4. User Interface

* QuMail provides a dedicated interface for registered users.
* Users authenticate using their registered email address and password.
* Users can access their inbox and manage their emails.
* The user interface contains sections such as:
  * Inbox
  * Sent
  * Starred
  * Trash
  * Drafts
* Users can compose and send emails.
* Users can receive emails from other registered users.
* Users can reply to received emails.
* Users can mark emails as read.
* Users can star important emails.
* Users can move emails to Trash.
* Users can restore deleted emails where applicable.
* Users can permanently delete emails from their Trash.
* Protected email content requires OTP verification before access.

## 5. Admin Interface

* QuMail provides a separate administrative interface.
* The administrator can manage registered users.
* The administrator can review email-related activities.
* The administrator can view conversations involving users.
* The administrator can respond to emails received from users.
* The administrator does not need to send unsolicited emails to users.
* Admin replies are maintained as part of the corresponding conversation.
* Conversation handling allows related replies to be grouped together.
* The administrator can monitor the overall email-security workflow.

## 6. User Registration

* New users can register through the QuMail registration interface.
* Registration requires:
  * Full Name
  * Email Address
  * Mobile Number
  * Password
  * Confirm Password
* Each user is assigned an email address under the `@qumail.io` domain.
* The system validates all registration fields before creating an account.
* Usernames are based on the registered email address.
* User passwords are stored using Django's password hashing mechanism rather than plaintext storage.
* A user profile is created along with the user account.
* The registered mobile number is stored in the user profile for OTP verification.

## 7. Input Validation

* The system validates the user's full name.
* The name is restricted to valid alphabetic characters and spaces.
* The email address must follow the required QuMail domain format.
* The mobile number must contain exactly 10 digits.
* Passwords must satisfy security requirements.
* The password must contain:
  * At least 8 characters
  * At least one uppercase letter
  * At least one lowercase letter
  * At least one number
  * At least one special character
* The password must not contain identifiable parts of the user's name or email address.
* Password confirmation is checked against the original password.
* Duplicate email addresses are rejected.
* Validation errors are returned to the user before account creation.

## 8. Authentication

* QuMail uses JWT-based authentication for API security.
* Users authenticate using their registered email address and password.
* Successful authentication generates an access token and refresh token.
* The access token is used to access protected APIs.
* Protected backend operations require authentication.
* JWT prevents unauthorized users from directly accessing protected application endpoints.
* Administrative access is handled separately from normal user access.

## 9. Qiskit-Based Quantum Key Generation

* The original implementation used conventional Python random functions to generate a random key.
* Conventional random generation provides a classical random key, but it does not demonstrate the actual concept of Quantum Key Distribution.
* The key-generation mechanism was therefore replaced with a Qiskit-based implementation of the BB84 protocol.
* Qiskit is an open-source framework used for programming quantum circuits.
* The BB84 implementation represents the quantum key-generation stage of QuMail.
* Alice prepares quantum states using randomly selected bits and bases.
* The quantum states are represented using BB84 basis states.
* Bob performs measurements using his selected measurement bases.
* Alice and Bob compare their selected bases without revealing their actual key bits.
* Measurements corresponding to matching bases are retained.
* Measurements corresponding to different bases are discarded.
* The remaining matching measurements are used to derive the shared secret key.
* This approach demonstrates the fundamental concept of quantum key distribution in software.
* The generated key is subsequently used as part of the email-encryption process.
* Qiskit provides the quantum-programming framework for implementing this process.

## 10. Why Python Random Generation Was Replaced

* The earlier implementation generated a key using conventional Python random functions.
* Such a method produces a classical random value.
* It does not represent quantum state preparation or quantum measurement.
* It does not demonstrate the BB84 protocol.
* It does not demonstrate the concept of basis reconciliation.
* It cannot demonstrate the quantum properties that make QKD different from conventional key generation.
* Replacing the random-key approach with Qiskit-based BB84 makes the project more closely aligned with the intended quantum-secure communication concept.
* The updated implementation therefore provides an educational demonstration of how a QKD-based key-generation mechanism can be integrated with classical encryption.

## 11. BB84 Protocol

* BB84 is a Quantum Key Distribution protocol.
* The protocol is used for establishing a shared secret key between two communicating parties.
* The two parties are commonly represented as Alice and Bob.
* Alice prepares quantum states using randomly selected bits and quantum bases.
* The quantum states are transmitted to Bob.
* Bob independently selects measurement bases.
* Bob measures the received quantum states using his selected bases.
* Alice and Bob publicly compare their basis choices.
* They retain only the measurements where their bases match.
* The resulting sequence forms the basis for the shared secret key.
* In a real QKD system, an eavesdropper attempting to measure the quantum states can introduce detectable disturbances.
* QuMail uses a software-based implementation of these BB84 concepts through Qiskit.

## 12. IBM Quantum Integration

* IBM Quantum provides access to IBM's quantum-computing infrastructure.
* Qiskit is used as the programming framework for constructing quantum circuits.
* IBM Quantum can provide quantum backends for executing quantum circuits.
* This allows the project to demonstrate the connection between quantum software and quantum-computing infrastructure.
* The project distinguishes between the Qiskit programming framework and IBM Quantum's quantum-computing infrastructure.
* Qiskit can be used for circuit construction and simulation.
* IBM Quantum backends can be used when execution on IBM quantum hardware or supported quantum services is required.
* The quantum component is used for the BB84 key-generation concept.
* AES-256-GCM remains responsible for encrypting the actual email content.

## 13. AES-256-GCM Encryption

* AES-256-GCM is used to encrypt email content.
* AES stands for Advanced Encryption Standard.
* The `256` represents the key size of 256 bits.
* GCM stands for Galois/Counter Mode.
* AES-256-GCM provides both confidentiality and integrity.
* The email message is encrypted before secure storage.
* The encryption process produces:
  * Ciphertext
  * Initialization Vector
  * Authentication Tag
* The secret key is required for successful decryption.
* The authentication tag helps detect unauthorized modification of the encrypted data.
* AES-256-GCM is responsible for actual email-data encryption, while BB84 is responsible for the quantum key-generation concept.

## 14. Secure Email Encryption

* When a user sends an email, the message is processed by the secure encryption mechanism.
* The system obtains the required secret key.
* AES-256-GCM encrypts the email content.
* The resulting ciphertext is stored instead of plaintext email content.
* The IV and authentication tag are stored as part of the encrypted email information.
* This protects sensitive email content from being directly exposed in the database.
* The recipient must pass the required security verification before accessing protected content.

## 15. Requirements

## Backend Requirements

* Python 3.12+
* Django 6.x
* Django REST Framework
* Django REST Framework Simple JWT
* Django Channels
* Daphne
* django-cors-headers
* Django MongoDB Backend
* PyMongo
* python-dotenv
* Boto3
* Qiskit
* Qiskit Aer
* IBM Quantum / Qiskit IBM Runtime
* PyCryptodome

## Frontend Requirements

* Node.js
* npm
* React
* Vite

## External Services

* MongoDB Atlas for database storage
* AWS SNS for OTP SMS delivery
* IBM Quantum for quantum-computing backend access, where configured

## Development Tools

* Git
* GitHub
* Postman for API testing

## Browser

* Google Chrome, Microsoft Edge, or any modern web browser.

## 16. Installation Procedure

## 16.1 Download the Project

* Download the **QuMail ZIP file** from the GitHub repository.
* Extract the ZIP file.
* Open the extracted `qumail-main` folder.

## 16.2 Install Python

* Download and install **Python 3.12+** from the official Python website.
* During installation, select **Add Python to PATH**.
* Verify the installation:

```bash
python --version
```

## 16.3 Install Node.js

* Download and install **Node.js** from the official Node.js website.
* Verify the installation:

```bash
node --version
npm --version
```

## 16.4 Create the `.env` File

* Open the backend folder containing `manage.py`.
* Create a file named:

```text
.env
```

* Add the required configuration in this format:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_NAME=qumail

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region

IBM_QUANTUM_TOKEN=your_ibm_quantum_token

```

* Replace the values with the required credentials.

## 16.5 Install Backend Libraries

* Open Git Bash inside the backend folder.
* Install the required Python libraries individually:

```bash
pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install channels
pip install daphne
pip install django-cors-headers
pip install django-mongodb-backend
pip install pymongo
pip install python-dotenv
pip install boto3
pip install qiskit
pip install qiskit-aer
pip install qiskit-ibm-runtime
pip install pycryptodome
```

## 16.6 Start the Backend

* From the folder containing `manage.py`, run:

```bash
python manage.py runserver
```

* The backend will run at:

```text
http://127.0.0.1:8000/
```

## 16.7 Install Frontend Libraries

* Open a **new Git Bash terminal**.
* Navigate to the React folder:

```bash
cd react
```

* Install the frontend dependencies:

```bash
npm install
```

## 16.8 Start the Frontend

* Run:

```bash
npm run dev
```

* Vite will display the frontend URL, normally:

```text
http://localhost:5173/
```

## 16.9 Access QuMail

* Open the frontend URL in a web browser.
* Register a new account or use an existing account.
* The React frontend communicates with the Django backend.
* MongoDB Atlas provides the database.
* AWS SNS provides OTP SMS delivery.
* Qiskit provides the BB84 quantum-key-generation implementation.
* IBM Quantum provides quantum-computing backend access when configured.
* AES-256-GCM provides email encryption.


## 17. Limitations of Existing Systems

* Most existing secure email systems primarily rely on **conventional cryptographic techniques** for key generation and encryption.
* Traditional systems generally use classical key-generation mechanisms rather than demonstrating **Quantum Key Distribution (QKD)** concepts.
* Existing systems may not integrate **BB84-based quantum key generation** with email encryption.
* Many systems do not provide a direct integration between **quantum computing frameworks and secure email communication**.
* Conventional cryptographic systems are designed around classical computing environments and may require additional mechanisms to address **future quantum-computing threats**.
* Quantum-key-generation concepts are generally not included as an integrated component of conventional email-security architectures.
* Existing systems may use authentication mechanisms without combining them with **OTP-based protected email retrieval, quantum key generation, and authenticated encryption** in a single application.
* There is a need for systems that demonstrate how **quantum-based key generation can work together with established encryption techniques** for secure communication.

## 18. Conclusion

* QuMail provides a secure email communication platform that combines **quantum key-generation concepts with classical cryptography**.
* The conventional random-key-generation approach was replaced with a **Qiskit-based BB84 implementation** to demonstrate the concept of Quantum Key Distribution.
* Qiskit provides the framework for implementing quantum circuits and the BB84 process.
* IBM Quantum provides access to quantum-computing infrastructure where configured.
* **AES-256-GCM** is used to provide confidentiality and integrity for email content.
* **OTP verification with AWS SNS** provides an additional security layer for protected email access.
* **MongoDB Atlas** provides persistent storage for application data and encrypted email information.
* The project demonstrates the practical integration of **quantum computing concepts, cryptography, authentication, cloud services, and secure email communication**.
* QuMail serves as an academic demonstration of how quantum-based key generation can complement existing cryptographic techniques.

## 19. Future Scope

* Integration with **real physical QKD systems** for practical quantum key distribution.
* Integration with quantum-optical components such as photon sources, detectors, and quantum communication channels.
* Implementation of BB84 using real quantum communication hardware.
* Improved quantum key management and automated key rotation.
* Integration with additional quantum-computing platforms and hardware.
* Enhanced detection of eavesdropping and quantum-channel attacks.
* Implementation of digital signatures for stronger sender authentication.
* Secure encryption of email attachments and files.
* Advanced multi-factor authentication mechanisms.
* Cloud deployment for real-world multi-user access.
* Enhanced security monitoring, auditing, and intrusion detection.
* Further optimization of quantum-key generation for large-scale secure communication.

## 20. Security Note

* Do not commit AWS credentials, MongoDB credentials, IBM Quantum tokens, or Django secret keys to GitHub.
* Store sensitive credentials in the .env file.
* Do not upload the .env file to the GitHub repository.
* OTP values should not be returned in API responses or printed in server logs in a production environment.
* Credentials that are accidentally exposed should be rotated immediately.
* The project is intended for academic and demonstration purposes and should undergo additional security testing before production deployment.

## 21. Project Structure

* qumail/ contains the Django backend.
* react/ contains the React frontend.
* README.md contains project documentation.
* Backend configuration and application files are maintained within the Django project.
* Frontend components and pages are maintained within the React project.
  
## 22. Contributors
* GVNS Tejaswi – tejaswigvns@gmail.com
* SSM Karthik  – somayajulakarthik@gmail.com
  
## 23. License
* This project is developed for academic and educational purposes.
* The project can be further enhanced and extended for research and demonstration purposes.
