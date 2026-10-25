#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import ssl

# Bypass SSL validation if using self-signed certificates in dev/prod
ssl_context = ssl._create_unverified_context()

# Définition des utilisateurs à créer et configurer
ADMIN_USERS = [
    {
        "username": "scola.ept",
        "email": "scola@ept.sn",
        "first_name": "Scolarité",
        "last_name": "EPT",
        "roles": ["SCOLARITE"]
    },
    {
        "username": "mdiallodiouf",
        "email": "mamadou.diallodiouf@ept.edu.sn",
        "first_name": "Mamadou",
        "last_name": "Diallo DIOUF",
        "roles": ["CHEF_DEPT", "LECTURER"]
    },
    {
        "username": "mseck",
        "email": "michel.seck@ept.edu.sn",
        "first_name": "Michel",
        "last_name": "SECK",
        "roles": ["RESP_PEDAGO", "LECTURER"]
    }
]

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
    print("==================================================")
    print("⚙️  KEYCLOAK ADMINISTRATIVE ROLES CONFIGURATION SCRIPT")
    print("==================================================")
    
    # Choix de l'environnement
    print("1) Production Direct (EC2 IP: 16.170.248.3)")
    print("2) Local Development (localhost:9080)")
    choice = input("Select environment [1]: ").strip()
    
    if choice == "2":
        server_url = "http://localhost:9080/auth"
    else:
        server_url = "https://16.170.248.3/auth"
        
    print(f"\n[+] Connecting to Keycloak at {server_url}...")
    
    try:
        access_token = get_admin_token(server_url)
        headers = {"Authorization": f"Bearer {access_token}"}
        print("[+] Successfully authenticated as Keycloak Administrator!")
    except Exception as e:
        print(f"[-] Authentication failed: {e}")
        return

    # 1. Vérification et création des Rôles
    target_roles = ["SCOLARITE", "CHEF_DEPT", "RESP_PEDAGO", "LECTURER"]
    print("\n[+] Step 1: Checking and creating missing realm roles...")
    for role_name in target_roles:
        role_url = f"{server_url}/admin/realms/lms/roles/{role_name}"
        try:
            make_request(role_url, "GET", headers)
            print(f"  [+] Role '{role_name}' already exists.")
        except urllib.error.HTTPError as he:
            if he.code == 404:
                print(f"  [!] Role '{role_name}' not found. Creating it...")
                create_role_url = f"{server_url}/admin/realms/lms/roles"
                try:
                    make_request(create_role_url, "POST", headers, {
                        "name": role_name, 
                        "description": f"LMS Administrative {role_name.capitalize()} Role"
                    })
                    print(f"  [+] Role '{role_name}' successfully created!")
                except Exception as ce:
                    print(f"  [-] Failed to create role '{role_name}': {ce}")
            else:
                print(f"  [-] Unexpected error checking role '{role_name}': {he}")

    # 2. Création et affectation des Utilisateurs
    print("\n[+] Step 2: Creating and configuring administrative users...")
    for u in ADMIN_USERS:
        print(f"\n--- Processing user: {u['username']} ---")
        
        user_payload = {
            "username": u["username"],
            "email": u["email"],
            "firstName": u["first_name"],
            "lastName": u["last_name"],
            "enabled": True,
            "credentials": [
                {
                    "type": "password",
                    "value": "password123",
                    "temporary": False
                }
            ],
            "requiredActions": []
        }
        
        create_url = f"{server_url}/admin/realms/lms/users"
        user_uuid = None
        
        try:
            status, res_headers, _ = make_request(create_url, "POST", headers, user_payload)
            if status == 201:
                print(f"  [+] User {u['username']} created successfully in Keycloak!")
                location = res_headers.get("Location")
                if location:
                    user_uuid = location.split("/")[-1]
        except urllib.error.HTTPError as he:
            if he.code == 409:
                print(f"  [!] User {u['username']} already exists. Retrieving details...")
                # Fetch existing user UUID
                find_url = f"{server_url}/admin/realms/lms/users?username={u['username']}"
                try:
                    _, _, users_list = make_request(find_url, "GET", headers)
                    if users_list and len(users_list) > 0:
                        user_uuid = users_list[0]["id"]
                        print(f"  [+] Found existing UUID: {user_uuid}")
                except Exception as fe:
                    print(f"  [-] Failed to fetch UUID: {fe}")
            else:
                print(f"  [-] Error during user creation: {he}")
                continue
        except Exception as e:
            print(f"  [-] Error processing user {u['username']}: {e}")
            continue

        if user_uuid:
            # Réinitialiser le mot de passe pour garantir l'accès (mode définitif)
            pwd_url = f"{server_url}/admin/realms/lms/users/{user_uuid}/reset-password"
            pwd_payload = {
                "type": "password",
                "value": "password123",
                "temporary": False
            }
            try:
                make_request(pwd_url, "PUT", headers, pwd_payload)
                print(f"  [+] Password reset to 'password123' (definitive).")
            except Exception as pe:
                print(f"  [-] Password reset failed: {pe}")

            # Enlever toute action requise résiduelle
            update_actions_url = f"{server_url}/admin/realms/lms/users/{user_uuid}"
            try:
                make_request(update_actions_url, "PUT", headers, {"requiredActions": []})
                print(f"  [+] Cleared any pending required actions.")
            except Exception as ae:
                print(f"  [-] Failed to clear required actions: {ae}")

            # Assignation de tous les rôles configurés
            for r in u["roles"]:
                role_get_url = f"{server_url}/admin/realms/lms/roles/{r}"
                try:
                    _, _, role_obj = make_request(role_get_url, "GET", headers)
                    if role_obj:
                        map_role_url = f"{server_url}/admin/realms/lms/users/{user_uuid}/role-mappings/realm"
                        make_request(map_role_url, "POST", headers, [role_obj])
                        print(f"  [+] Successfully mapped role '{r}'.")
                except Exception as re:
                    print(f"  [-] Failed to assign role '{r}': {re}")

    print("\n==================================================")
    print("🏁  KEYCLOAK ADMINISTRATIVE ROLES CONFIGURATION DONE!")
    print("==================================================")

if __name__ == "__main__":
    main()
