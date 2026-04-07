# Real-World Setup Guide for Aditya Electronics

This guide will walk you through every step to take this website from a prototype to a live, professional business website.

---

## Phase 1: Setting Up Your Professional Database (MySQL)

Since you want to use this in real life, you need a database that stays online 24/7. I recommend **TiDB Cloud** (Free Tier).

1.  **Create Account**: Go to [TiDB Cloud](https://tidbcloud.com/) and sign up.
2.  **Create Cluster**: 
    *   Click **"Create Cluster"**.
    *   Select **"Serverless"** (it's free forever).
    *   Choose a region (e.g., Mumbai or Singapore).
3.  **Get Connection Details**:
    *   Click **"Connect"** on your cluster dashboard.
    *   Choose **"Connect with standard connection string"**.
    *   **IMPORTANT**: Generate a password and copy it immediately.
    *   Copy the **Host**, **User**, **Port**, and **Database Name**.

---

## Phase 2: Preparing Your Code for Deployment

You need to tell the website how to talk to your new database.

1.  **Environment Variables**: In your hosting platform (see Phase 3), you must set these "Secrets":
    *   `MYSQL_HOST`: (The host you copied from TiDB)
    *   `MYSQL_USER`: (The user you copied)
    *   `MYSQL_PASSWORD`: (The password you generated)
    *   `MYSQL_DATABASE`: (Usually `test` or your custom name)
    *   `MYSQL_PORT`: `4000` (for TiDB)
    *   `MYSQL_SSL`: `true`
    *   `JWT_SECRET`: (Create a long random string like `Aditya_2026_Secure_Key!`)

---

## Phase 3: Deploying Your Website (Hosting)

I recommend **Render.com** because it can host both your Backend (Node.js) and Frontend (React) together.

1.  **Create Render Account**: Sign up at [Render.com](https://render.com/).
2.  **New Web Service**:
    *   Connect your GitHub repository (or upload your code).
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install && npm run build`.
    *   **Start Command**: `npm start`.
3.  **Add Environment Variables**: Go to the **"Environment"** tab in Render and add all the variables from Phase 2.
4.  **Persistent Storage (Optional but Recommended)**:
    *   Since product images are uploaded to the `/uploads` folder, they will be deleted every time you update the site unless you add a "Disk".
    *   In Render, go to **"Disks"** -> **"Add Disk"**.
    *   **Mount Path**: `/uploads`.
    *   **Size**: 1GB is plenty for start.

---

## Phase 4: Using the Website as an Owner (Admin)

Once live, your website will be at a URL like `aditya-electronics.onrender.com`.

### 1. Initial Login
*   Go to your website URL.
*   Click **Login** and use:
    *   **Email**: `admin@adityaelectronics.com`
    *   **Password**: `admin123`
*   **CRITICAL**: Immediately go to the Admin Dashboard and change your password for security!

### 2. Adding Your Real Products
*   Go to **Admin Dashboard** -> **Manage Products**.
*   Click **"Add Product"**.
*   Upload clear photos of your LED/LCD motherboards, backlights, etc.
*   Write detailed descriptions so customers know exactly what they are looking at.

### 3. Handling Customer Chats
*   When a customer clicks "Chat with Expert" on a product, they will send you a message.
*   You will see a notification (or check the **Chats** section in Admin).
*   You can reply in real-time to discuss prices or compatibility.

### 4. Managing Service Bookings
*   When a customer fills the "Book Home Service" form, it appears in **Admin** -> **Bookings**.
*   You can see their phone number and address.
*   Call them to confirm the time, then mark the booking as "Completed" once the job is done.

---

## Phase 5: Getting a Custom Domain (Optional)

If you want a professional name like `www.adityaelectronics.com`:

1.  Buy the domain from **GoDaddy** or **Namecheap**.
2.  In Render, go to **"Settings"** -> **"Custom Domains"**.
3.  Add your domain and follow the instructions to update your DNS settings.

---

## Minor Tips for Success:
*   **WhatsApp Integration**: I have added links that open WhatsApp directly. Make sure the phone numbers in `App.tsx` are correct.
*   **SEO**: The `metadata.json` I created helps Google find your shop.
*   **Security**: Never share your `JWT_SECRET` or Database password with anyone.
