import qrcode
import os

# දත්ත ඇතුළත් කිරීම (PDF එකෙන් ලබාගත් තොරතුරු)
light_items = [
    {"name": "K10 Mini-B 740", "qty": 16},
    {"name": "K15 B-Eye 1940", "qty": 32},
    {"name": "GL 400W 2 Colour MH", "qty": 16},
    {"name": "GL 400w CTO MH", "qty": 16},
    {"name": "12 x 40W Pan Beam Batton Zoom Bar", "qty": 12},
    {"name": "2 Eye Blinder RGBWA", "qty": 5},
    {"name": "3 in 1 BSW 420", "qty": 60},
    {"name": "1000Z 2825w", "qty": 32},
    {"name": "20R BSW HM-3826", "qty": 70},
    {"name": "2520LED Matrix MH", "qty": 12},
]

# ආරම්භක ID අංකය
current_id = 222221

# QR codes ගබඩා කිරීමට folder එකක් සෑදීම
output_dir = "Generated_QRs"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print("QR Code ජනනය වෙමින් පවතී...")

for item in light_items:
    item_name = item["name"]
    sticker_qty = item["qty"]
    
    # එක් එක් sticker ප්‍රමාණයට QR සෑදීම
    for i in range(1, sticker_qty + 1):
        # QR එකට ඇතුළත් වන දත්ත
        qr_data = f"{current_id}"
        
        # QR Code එක සෑදීම
        qr = qrcode.QRCode(version=1, box_size=10, border=0)
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # ගොනු නාමය (File Name) සෑදීම
        file_name = f"{current_id}_{item_name.replace(' ', '_')}.png"
        img.save(os.path.join(output_dir, file_name))
        
        # ඊළඟ ID එකට යෑම
        current_id += 1

print(f"සාර්ථකයි! QR කේත සියල්ල '{output_dir}' ෆෝල්ඩරයේ සුරැකිණි.")