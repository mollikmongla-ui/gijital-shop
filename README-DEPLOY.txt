DEPLOY (Netlify)
1) Netlify > Add new site > Deploy manually: এই ZIP (বা আনজিপ করা ফোল্ডার) ড্র্যাগ করুন। (index.html ZIP-এর রুটে আছে)
2) Site configuration > Environment variables:
   BOT_TOKEN, CHAT_ID        -> Real অর্ডারের Telegram নোটিফিকেশন
   DEMO_MODE=true            -> শুধু টেস্টের সময় (Demo: /?demo=1)
   DEMO_ADMIN_KEY=<গোপন কী>  -> Demo অর্ডার দেখার জন্য
3) Variables দেওয়ার পর Deploys > Trigger deploy > Deploy site।
Demo অর্ডার: /?demo=1 — আলাদা স্টোরে যায়, সবসময় payment_status=not_paid।
Real অর্ডার: / — TrxID ফরম্যাট যাচাই হয়, কিন্তু টাকা এসেছে কিনা আপনাকে bKash/Nagad অ্যাপে মিলিয়ে নিতে হবে (মেসেজে UNVERIFIED লেখা থাকে)।
