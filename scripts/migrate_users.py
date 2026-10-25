#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import ssl

# Bypass SSL validation if using self-signed certificates in dev/prod
ssl_context = ssl._create_unverified_context()

# 1. Complete static list of 39 legacy users to migrate
USERS_TO_MIGRATE = [
    {"username": "acharbeladonis", "email": "acharbeladonis@ept.edu.sn", "role": "student", "first_name": "Charbel", "last_name": "Ahossi"},
    {"username": "bbintou", "email": "bbintou@ept.edu.sn", "role": "student", "first_name": "Binetou", "last_name": "Ba"},
    {"username": "bmouhamadoualiou", "email": "bmouhamadoualiou@ept.edu.sn", "role": "student", "first_name": "Mouhamadou", "last_name": "Ba"},
    {"username": "dndeyeabsa", "email": "dndeyeabsa@ept.edu.sn", "role": "student", "first_name": "Ndeye", "last_name": "Der"},
    {"username": "diaibrahima", "email": "diaibrahima@ept.edu.sn", "role": "student", "first_name": "Ibrahima", "last_name": "Dia"},
    {"username": "dcheikhoumar", "email": "dcheikhoumar@ept.edu.sn", "role": "student", "first_name": "Cheikh", "last_name": "Diallo"},
    {"username": "diawmf", "email": "diawmf@ept.edu.sn", "role": "student", "first_name": "Mamadou", "last_name": "Diaw"},
    {"username": "dieyef", "email": "dieyef@ept.edu.sn", "role": "student", "first_name": "Fatima", "last_name": "Dièye"},
    {"username": "diopas", "email": "diopas@ept.edu.sn", "role": "student", "first_name": "Adja", "last_name": "Diop"},
    {"username": "dmedoune", "email": "dmedoune@ept.edu.sn", "role": "student", "first_name": "Médoune", "last_name": "Diop"},
    {"username": "dfasyaka", "email": "dfasyaka@ept.edu.sn", "role": "student", "first_name": "Fa", "last_name": "Diouf"},
    {"username": "fianyaha", "email": "fianyaha@ept.edu.sn", "role": "student", "first_name": "Aminata", "last_name": "Fianyah"},
    {"username": "gayeaf", "email": "gayeaf@ept.edu.sn", "role": "student", "first_name": "Abdou", "last_name": "Gaye"},
    {"username": "mbaoaida", "email": "mbaoaida@ept.edu.sn", "role": "student", "first_name": "Aïda", "last_name": "Mbao"},
    {"username": "mbayey", "email": "mbayey@ept.edu.sn", "role": "student", "first_name": "Yacine", "last_name": "Mbaye"},
    {"username": "mboupas", "email": "mboupas@ept.edu.sn", "role": "student", "first_name": "Abdou", "last_name": "Mboup"},
    {"username": "ndawas", "email": "ndawas@ept.edu.sn", "role": "student", "first_name": "Abdoulaye", "last_name": "Ndaw"},
    {"username": "ndiayemaimouna", "email": "ndiayemaimouna@ept.edu.sn", "role": "student", "first_name": "Maïmouna", "last_name": "Ndiaye"},
    {"username": "ndiayemouhamed", "email": "ndiayemouhamed@ept.edu.sn", "role": "student", "first_name": "Mohamed", "last_name": "Ndiaye"},
    {"username": "sallatc", "email": "sallatc@ept.edu.sn", "role": "student", "first_name": "Adjia", "last_name": "Sall"},
    {"username": "sambemf", "email": "sambemf@ept.edu.sn", "role": "student", "first_name": "Matar", "last_name": "Sambe"},
    {"username": "smohamedamine", "email": "smohamedamine@ept.edu.sn", "role": "student", "first_name": "Mohamed", "last_name": "Sembène"},
    {"username": "Sorolj", "email": "Sorolj@ept.edu.sn", "role": "student", "first_name": "Lamogo", "last_name": "Soro"},
    {"username": "sowaissatou", "email": "sowaissatou@ept.edu.sn", "role": "student", "first_name": "Aissatou", "last_name": "Sow"},
    {"username": "sowma", "email": "sowma@ept.edu.sn", "role": "student", "first_name": "Mouhamadou", "last_name": "Sow"},
    {"username": "tahanal", "email": "tahanal@ept.edu.sn", "role": "student", "first_name": "Nazar", "last_name": "Taha"},
    {"username": "thamath", "email": "thamath@ept.edu.sn", "role": "student", "first_name": "Amath", "last_name": "Thiam"},
    {"username": "tourect", "email": "tourect@ept.edu.sn", "role": "student", "first_name": "Cheikh", "last_name": "Touré"},
    {"username": "mndione", "email": "mndione@ept.edu.sn", "role": "lecturer", "first_name": "Moussa", "last_name": "Ndione"},
    {"username": "nfatoungom", "email": "ndeye.fatoungom@ept.edu.sn", "role": "lecturer", "first_name": "Ndeye", "last_name": "Fatou NGOM"},
    {"username": "mseck", "email": "michel.seck@ept.edu.sn", "role": "lecturer", "first_name": "Michel", "last_name": "SECK"},
    {"username": "oniang", "email": "oumar.niang@ept.edu.sn", "role": "lecturer", "first_name": "Oumar", "last_name": "NIANG"},
    {"username": "amouhamadouwade", "email": "mwade@ept.edu.sn", "role": "lecturer", "first_name": "Amadou Mouhamadou", "last_name": "WADE"},
    {"username": "aguisse", "email": "abdoulaye.guisse@ept.edu.sn", "role": "lecturer", "first_name": "Abdoulaye", "last_name": "GUISSE"},
    {"username": "admin", "email": "admin@lms.sn", "role": "admin", "first_name": "Admin", "last_name": "LMS"},
    {"username": "aaciss", "email": "aaciss@ept.edu.sn", "role": "lecturer", "first_name": "Abdoul Aziz", "last_name": "CISS"},
    {"username": "mdiallodiouf", "email": "mamadou.diallodiouf@ept.edu.sn", "role": "lecturer", "first_name": "Mamadou", "last_name": "Diallo DIOUF"},
    {"username": "ssidibe", "email": "samba.sidibe@ept.edu.sn", "role": "lecturer", "first_name": "Samba", "last_name": "SIDIBE"},
    {"username": "igueye", "email": "ibrahima.gueye@ept.edu.sn", "role": "lecturer", "first_name": "Ibrahima", "last_name": "GUEYE"}
]

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as response:
            if response.status in [200, 201]:
                res_body = response.read().decode("utf-8")
                return response.status, response.headers, json.loads(res_body) if res_body else None
            return response.status, response.headers, None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"[-] HTTP Error {e.code} on {method} {url}: {error_body}")
        raise e

def main():
    print("==================================================")
    print("🚀  KEYCLOAK BATCH USER MIGRATION SCRIPT")
    print("==================================================")
    
    # Let user input their server IP or domain if different
    default_url = "http://localhost:9080/auth"
    server_url = input(f"Enter Keycloak external URL [{default_url}]: ").strip()
    if not server_url:
        server_url = default_url
    
    # 1. Retrieve Admin JWT Access Token
    print("\n[+] Step 1: Requesting admin credentials token...")
    token_url = f"{server_url}/realms/master/protocol/openid-connect/token"
    
    token_payload = "client_id=admin-cli&username=admin&password=admin_password&grant_type=password"
    req = urllib.request.Request(
        token_url,
        data=token_payload.encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, context=ssl_context) as res:
            res_json = json.loads(res.read().decode("utf-8"))
            access_token = res_json["access_token"]
            print("[+] Successfully authenticated as admin!")
    except Exception as e:
        print(f"[-] Failed to authenticate. Please make sure Keycloak is running at {server_url}.")
        print(f"Details: {e}")
        return

    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Check and ensure roles exist in Keycloak
    print("\n[+] Step 2: Ensuring realm roles 'student', 'lecturer' and 'admin' exist in Keycloak...")
    for role_name in ["student", "lecturer", "admin"]:
        role_url = f"{server_url}/admin/realms/lms/roles/{role_name}"
        try:
            make_request(role_url, "GET", headers)
            print(f"[+] Role '{role_name}' already exists.")
        except urllib.error.HTTPError as he:
            if he.code == 404:
                print(f"[!] Role '{role_name}' not found. Creating it automatically...")
                create_role_url = f"{server_url}/admin/realms/lms/roles"
                try:
                    make_request(create_role_url, "POST", headers, {"name": role_name, "description": f"LMS {role_name.capitalize()} Role"})
                    print(f"[+] Role '{role_name}' successfully created!")
                except Exception as ce:
                    print(f"[-] Failed to create role '{role_name}': {ce}")
            else:
                print(f"[-] Unexpected error checking role '{role_name}': {he}")

    # 3. Iterate and create each user
    print(f"\n[+] Step 3: Migrating {len(USERS_TO_MIGRATE)} users...")
    
    for u in USERS_TO_MIGRATE:
        print(f"\n--- Migrating {u['username']} ({u['role']}) ---")
        
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
                    "temporary": True
                }
            ],
            "requiredActions": ["UPDATE_PASSWORD"]
        }
        
        create_url = f"{server_url}/admin/realms/lms/users"
        try:
            status, res_headers, _ = make_request(create_url, "POST", headers, user_payload)
            if status == 201 or status == 200:
                print(f"[+] User {u['username']} created successfully in Keycloak!")
                
                # Fetch user UUID from Location header
                location = res_headers.get("Location")
                if location:
                    user_uuid = location.split("/")[-1]
                    
                    # For all roles including admin, fetch and assign the role
                    role_url = f"{server_url}/admin/realms/lms/roles/{u['role']}"
                    try:
                        _, _, role_obj = make_request(role_url, "GET", headers)
                        
                        if role_obj:
                            map_role_url = f"{server_url}/admin/realms/lms/users/{user_uuid}/role-mappings/realm"
                            make_request(map_role_url, "POST", headers, [role_obj])
                            print(f"[+] Assigned realm role '{u['role']}' to {u['username']} successfully!")
                    except Exception as e:
                        print(f"[-] Failed to assign role '{u['role']}' to {u['username']}: {e}")
            else:
                print(f"[-] Unexpected status during creation: {status}")
        except urllib.error.HTTPError as he:
            if he.code == 409:
                print(f"[!] User {u['username']} already exists in Keycloak.")
                
                # If user already exists, let's update their email to the new canonical edu.sn domain!
                try:
                    # Find existing user UUID by username
                    find_url = f"{server_url}/admin/realms/lms/users?username={u['username']}"
                    _, _, users_list = make_request(find_url, "GET", headers)
                    if users_list and len(users_list) > 0:
                        user_uuid = users_list[0]["id"]
                        
                        # Perform PUT request to update email, firstName, and lastName
                        update_url = f"{server_url}/admin/realms/lms/users/{user_uuid}"
                        update_payload = {
                            "username": u["username"],
                            "email": u["email"],
                            "firstName": u["first_name"],
                            "lastName": u["last_name"]
                        }
                        make_request(update_url, "PUT", headers, update_payload)
                        print(f"[+] Successfully updated existing {u['username']} profile in Keycloak (email: {u['email']})!")
                        
                        # Ensure they have their role assigned (all roles including admin)
                        role_url = f"{server_url}/admin/realms/lms/roles/{u['role']}"
                        try:
                            _, _, role_obj = make_request(role_url, "GET", headers)
                            if role_obj:
                                map_role_url = f"{server_url}/admin/realms/lms/users/{user_uuid}/role-mappings/realm"
                                make_request(map_role_url, "POST", headers, [role_obj])
                                print(f"[+] Assigned realm role '{u['role']}' to existing {u['username']} successfully!")
                        except Exception as e:
                            print(f"[-] Failed to assign role '{u['role']}' to existing {u['username']}: {e}")
                except Exception as re:
                    print(f"[!] Could not update existing user {u['username']}: {re}")
            else:
                print(f"[-] Failed to migrate {u['username']}.")
        except Exception as e:
            print(f"[-] Error migrating {u['username']}: {e}")

    print("\n==================================================")
    print("🏁  MIGRATION COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
