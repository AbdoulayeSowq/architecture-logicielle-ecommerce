#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import ssl

ssl_context = ssl._create_unverified_context()

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    
    # Injection du Host Header pour le routage SNI / Nginx proxy
    headers["Host"] = "lms-ept.duckdns.org"
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            if response.status in [200, 201, 204]:
                res_body = response.read().decode("utf-8")
                return response.status, response.headers, json.loads(res_body) if res_body else None
            return response.status, response.headers, None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"[-] HTTP Error {e.code} on {method} {url}: {error_body}")
        raise e

def get_admin_token(server_url):
    token_url = f"{server_url}/realms/master/protocol/openid-connect/token"
    token_payload = "client_id=admin-cli&username=admin&password=admin_password&grant_type=password"
    req = urllib.request.Request(
        token_url,
        data=token_payload.encode("utf-8"),
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Host": "lms-ept.duckdns.org"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, context=ssl_context) as response:
        res_body = json.loads(response.read().decode("utf-8"))
        return res_body["access_token"]

def main():
    # Utilisation de l'IP de production en direct pour contourner les blocages DNS locaux
    server_url = "https://16.170.248.3/auth"
    print(f"[+] Connecting to Keycloak via direct IP at {server_url} with Host header...")
    
    try:
        access_token = get_admin_token(server_url)
        headers = {"Authorization": f"Bearer {access_token}"}
        print("[+] Successfully authenticated as Keycloak Administrator!")
    except Exception as e:
        print(f"[-] Authentication failed: {e}")
        return

    # Get all users in the realm 'lms'
    users_url = f"{server_url}/admin/realms/lms/users?max=100"
    try:
        _, _, users = make_request(users_url, "GET", headers)
        print(f"[+] Found {len(users)} users in realm 'lms'.")
    except Exception as e:
        print(f"[-] Failed to fetch users: {e}")
        return

    success_count = 0
    for u in users:
        username = u["username"]
        user_uuid = u["id"]
        
        if username == "admin":
            continue
            
        print(f"\n[*] Resetting user to temporary state: {username} ({user_uuid})...")
        
        # Get fresh token to avoid timeout
        try:
            fresh_token = get_admin_token(server_url)
            headers = {"Authorization": f"Bearer {fresh_token}"}
        except Exception as e:
            print(f"  [-] Failed to refresh admin token: {e}")
            continue
        
        # A. Set requiredActions to ['UPDATE_PASSWORD']
        update_url = f"{server_url}/admin/realms/lms/users/{user_uuid}"
        update_payload = {
            "requiredActions": ["UPDATE_PASSWORD"]
        }
        try:
            make_request(update_url, "PUT", headers, update_payload)
            print(f"  [+] Set requiredActions to ['UPDATE_PASSWORD'] for {username}")
        except Exception as e:
            print(f"  [-] Failed to update requiredActions: {e}")
            continue

        # B. Reset password to password123 with temporary=True
        pwd_url = f"{server_url}/admin/realms/lms/users/{user_uuid}/reset-password"
        pwd_payload = {
            "type": "password",
            "value": "password123",
            "temporary": True
        }
        try:
            make_request(pwd_url, "PUT", headers, pwd_payload)
            print(f"  [+] Reset password to 'password123' (temporary) for {username}")
            success_count += 1
        except Exception as e:
            print(f"  [-] Failed to reset password: {e}")
            continue

    print("\n==================================================")
    print(f"🎉 SUCCESS: Restored {success_count} accounts back to temporary password state!")
    print("==================================================")

if __name__ == "__main__":
    main()
