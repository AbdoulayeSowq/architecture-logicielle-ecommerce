-- Clean existing data
TRUNCATE TABLE practice_test_cases CASCADE;
TRUNCATE TABLE exercise_allowed_languages CASCADE;
TRUNCATE TABLE exercise_language_wrappers CASCADE;
TRUNCATE TABLE exercise_language_starter_codes CASCADE;
TRUNCATE TABLE coding_exercises CASCADE;

-- ---------------------------------------------------------
-- EXERCISE 1: Two Sum
-- ---------------------------------------------------------
INSERT INTO coding_exercises (id, title, description, difficulty, competence, published, module_id, created_at)
VALUES (1, 'Two Sum', '### Description

Étant donné un tableau d''entiers `nums` et un entier `target`, retournez les indices des deux nombres tels qu''ils s''additionnent à `target`.

Vous pouvez supposer que chaque entrée aurait exactement une solution, et vous ne pouvez pas utiliser le même élément deux fois.

### Exemple

**Entrée :** `nums = [2,7,11,15]`, `target = 9`  
**Sortie :** `[0,1]`  
**Explication :** Car `nums[0] + nums[1] == 9`, nous retournons `[0, 1]`.', 'EASY', 'Tableaux & Hashing', true, 1, NOW());

-- Allowed languages for Two Sum
INSERT INTO exercise_allowed_languages (exercise_id, language) VALUES (1, 'python');
INSERT INTO exercise_allowed_languages (exercise_id, language) VALUES (1, 'javascript');

-- Starter codes
INSERT INTO exercise_language_starter_codes (exercise_id, language, starter_code)
VALUES (1, 'python', 'def two_sum(nums, target):
    # Écrivez votre code ici
    pass');

INSERT INTO exercise_language_starter_codes (exercise_id, language, starter_code)
VALUES (1, 'javascript', 'function twoSum(nums, target) {
    // Écrivez votre code ici
    return [];
}');

-- Wrappers (used by Piston to feed stdin to user code)
-- For Python: read nums and target from stdin, call two_sum, print result with LMS delimiters
INSERT INTO exercise_language_wrappers (exercise_id, language, wrapper_code)
VALUES (1, 'python', 'import sys
import json
{{user_code}}

if __name__ == "__main__":
    try:
        lines = sys.stdin.read().splitlines()
        if not lines:
            sys.exit(0)
        nums = json.loads(lines[0])
        target = int(lines[1])
        result = two_sum(nums, target)
        print("---LMS_RESULT_START---")
        print(json.dumps(result))
        print("---LMS_RESULT_END---")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)');

-- For JS
INSERT INTO exercise_language_wrappers (exercise_id, language, wrapper_code)
VALUES (1, 'javascript', 'const fs = require("fs");
{{user_code}}

const input = fs.readFileSync(0, "utf-8").trim().split("\n");
if (input.length >= 2) {
    const nums = JSON.parse(input[0]);
    const target = parseInt(input[1]);
    const result = twoSum(nums, target);
    console.log("---LMS_RESULT_START---");
    console.log(JSON.stringify(result));
    console.log("---LMS_RESULT_END---");
}');

-- Test cases
INSERT INTO practice_test_cases (exercise_id, input, expected_output, hidden, order_index, weight_percent, label, explanation)
VALUES (1, '[2,7,11,15]
9', '[0, 1]', false, 0, 50, 'Cas nominal', '2 + 7 = 9');

INSERT INTO practice_test_cases (exercise_id, input, expected_output, hidden, order_index, weight_percent, label, explanation)
VALUES (1, '[3,2,4]
6', '[1, 2]', true, 1, 50, 'Cas caché 1', '3 + 3 est exclu car on ne peut utiliser le même élément');


-- ---------------------------------------------------------
-- EXERCISE 2: Palindrome
-- ---------------------------------------------------------
INSERT INTO coding_exercises (id, title, description, difficulty, competence, published, module_id, created_at)
VALUES (2, 'Vérifier un Palindrome', '### Description

Déterminez si une chaîne de caractères est un palindrome. Un palindrome est un mot qui se lit de la même manière dans les deux sens (ex: "radar", "kayak").

### Exemple

**Entrée :** `"radar"`  
**Sortie :** `true`', 'EASY', 'Chaînes de caractères', true, 1, NOW());

-- Allowed languages for Palindrome
INSERT INTO exercise_allowed_languages (exercise_id, language) VALUES (2, 'python');
INSERT INTO exercise_allowed_languages (exercise_id, language) VALUES (2, 'javascript');

-- Starter codes
INSERT INTO exercise_language_starter_codes (exercise_id, language, starter_code)
VALUES (2, 'python', 'def is_palindrome(s):
    # Écrivez votre code ici
    return False');

INSERT INTO exercise_language_starter_codes (exercise_id, language, starter_code)
VALUES (2, 'javascript', 'function isPalindrome(s) {
    // Écrivez votre code ici
    return false;
}');

-- Wrappers
INSERT INTO exercise_language_wrappers (exercise_id, language, wrapper_code)
VALUES (2, 'python', 'import sys
{{user_code}}

if __name__ == "__main__":
    s = sys.stdin.read().strip()
    result = is_palindrome(s)
    print("---LMS_RESULT_START---")
    print(str(result).lower())
    print("---LMS_RESULT_END---")');

INSERT INTO exercise_language_wrappers (exercise_id, language, wrapper_code)
VALUES (2, 'javascript', 'const fs = require("fs");
{{user_code}}

const s = fs.readFileSync(0, "utf-8").trim();
const result = isPalindrome(s);
console.log("---LMS_RESULT_START---");
console.log(result.toString());
console.log("---LMS_RESULT_END---");');

-- Test cases
INSERT INTO practice_test_cases (exercise_id, input, expected_output, hidden, order_index, weight_percent, label, explanation)
VALUES (2, 'radar', 'true', false, 0, 50, 'Palindromic word', 'radar is read radar backwards');

INSERT INTO practice_test_cases (exercise_id, input, expected_output, hidden, order_index, weight_percent, label, explanation)
VALUES (2, 'hello', 'false', true, 1, 50, 'Non-palindromic word', 'hello backwards is olleh');

-- Adjust sequences
SELECT setval('coding_exercises_id_seq', (SELECT MAX(id) FROM coding_exercises));
SELECT setval('practice_test_cases_id_seq', (SELECT MAX(id) FROM practice_test_cases));
