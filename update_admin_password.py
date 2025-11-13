"""
Update admin password directly in the database
"""
import sys
sys.path.append('backend')

from werkzeug.security import generate_password_hash, check_password_hash
from common import Database

print("="*60)
print("Update Admin Password in Database")
print("="*60)

# Initialize database
try:
    Database.initialize_pool()
    print("\n[OK] Database connection initialized")
except Exception as e:
    print(f"\n[ERROR] Database connection failed: {e}")
    sys.exit(1)

# Generate new password hash
password = 'admin123'
hashed = generate_password_hash(password, method='pbkdf2:sha256')

print(f"\nPassword: {password}")
print(f"Hash method: pbkdf2:sha256")
print(f"New hash: {hashed[:50]}...")

# Verify hash works before updating
is_valid = check_password_hash(hashed, password)
if not is_valid:
    print("\n[ERROR] Hash verification failed! Not updating database.")
    sys.exit(1)

print("\n[OK] Hash verified successfully")

# Update database
print("\nUpdating database...")
try:
    Database.execute_query(
        "UPDATE admins SET password = %s WHERE username = %s",
        (hashed, 'admin')
    )
    print("[OK] Password updated successfully!")
except Exception as e:
    print(f"[ERROR] Failed to update password: {e}")
    sys.exit(1)

# Verify the update
print("\nVerifying update...")
admin = Database.execute_query(
    "SELECT username, email, password FROM admins WHERE username = %s",
    ('admin',),
    fetch_one=True
)

if admin:
    print(f"[OK] Admin found: {admin['username']} ({admin['email']})")
    print(f"[OK] Password hash: {admin['password'][:50]}...")
    
    # Test password
    is_valid = check_password_hash(admin['password'], password)
    if is_valid:
        print(f"\n[OK] Password verification: SUCCESS")
        print("\n" + "="*60)
        print("✓ Password updated and verified!")
        print("="*60)
        print("\nYou can now login with:")
        print(f"  Username: {admin['username']}")
        print(f"  Email: {admin['email']}")
        print(f"  Password: {password}")
        print("="*60)
    else:
        print(f"\n[ERROR] Password verification: FAILED")
        print("Something went wrong!")
else:
    print("[ERROR] Admin not found after update!")

print()

