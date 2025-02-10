# ds-chatbot
A Flask-based chatbot utilizing Ollama and the Deepseek model to generate more accurate AI responses. This project allows users to interact with the chatbot locally with easy deployment through Flask.


Agar pengguna lain bisa mengikuti dengan mudah, buat file README.md dengan isi seperti ini:

md
Copy
Edit
# Flask-Ollama Chatbot

Sebuah chatbot berbasis Flask yang menggunakan Ollama untuk menjalankan model AI.

## 🚀 Cara Menjalankan

### 1️⃣ **Persyaratan**
- Python 3.8 atau lebih baru
- Ollama sudah terinstal di sistem (`ollama` harus bisa diakses dari terminal)
- Git dan pip sudah terinstal

### 2️⃣ **Clone Repositori**
Jalankan perintah berikut di terminal:

```bash
git clone https://github.com/username/flask-ollama-chatbot.git
cd flask-ollama-chatbot

3️⃣ Buat Virtual Environment
Untuk menghindari konflik dependensi, buat environment virtual:
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate      # Windows

4️⃣ Instal Dependensi
Jalankan perintah:
pip install -r requirements.txt

5️⃣ Menjalankan Aplikasi
Setelah semua terinstal, jalankan:
flask run atau python app.py

Aplikasi akan berjalan di http://127.0.0.1:5000
