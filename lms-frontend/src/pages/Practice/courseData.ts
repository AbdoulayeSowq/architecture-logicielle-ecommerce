export interface Lesson {
  id: string;
  title: string;
  type: "article" | "exercise" | "quiz";
  locked?: boolean;
  content?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface CourseData {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  accentColor: string;
  totalItems: number;
  chapters: Chapter[];
}

const DSA_INTRO_BIG_O = `
## Introduction to Big O

If you already understand big O, you can skip this article.

Before we talk about big O, it's important that we first understand what exactly an "algorithm" is, especially in the context of this course.

An algorithm can be seen as a *recipe* for a computer to follow. It's a set of instructions that will allow a computer to solve a problem step-by-step.

Algorithms take an **input** and produce an **output**. The output will be the answer to a question regarding the input. For example, let's say you had a non-empty array of positive integers called \`nums\`, and you wanted to answer the question: "What is the largest number in \`nums\`?".

To answer this question, you would write an algorithm that takes an array called \`nums\` as **input** and **outputs** the largest number in \`nums\`. Here is an example of such an algorithm:

1. Create a variable **maximum** and initialize it to \`0\`.
2. Iterate over each element \`num\` in \`nums\`.
3. If \`num\` is greater than **maximum**, update \`maximum = num\`.
4. Output **maximum**.

---

## What is Big O notation?

Big O notation is a way to measure the **time complexity** and **space complexity** of an algorithm. It describes how the runtime or memory usage of an algorithm grows as the input size increases.

### Time Complexity

Time complexity refers to how the number of operations an algorithm performs scales with the input size.

\`\`\`java
// O(n) - Linear time
for (int i = 0; i < nums.length; i++) {
    System.out.println(nums[i]);
}
\`\`\`

\`\`\`java
// O(n²) - Quadratic time
for (int i = 0; i < nums.length; i++) {
    for (int j = 0; j < nums.length; j++) {
        System.out.println(nums[i] + nums[j]);
    }
}
\`\`\`

### Space Complexity

Space complexity refers to how much memory an algorithm uses relative to the input size.

\`\`\`java
// Given an integer array "arr" with length n
int[] nums = new int[n];
int oneHundredth = n / 100;

for (int i = 0; i < oneHundredth; i++) {
    nums.add(arr[i]);
}
\`\`\`

This algorithm has a space complexity of O(n). The array \`nums\` stores n integers at the end of the algorithm.

\`\`\`java
// Given an integer arrays "arr" with length n and "arr2" with length m,
int[][] grid = new int[n][m];

for (int i = 0; i < arr.length; i++) {
    for (int j = 0; j < arr2.length; j++) {
        grid[i][j] = arr[i] * arr2[j];
    }
}
\`\`\`

This algorithm has a space complexity of O(n·m). We are creating a grid that has dimensions n × m.

> **Note**: In this course, we will talk extensively about time and space complexity. If it's a new concept to you, don't worry — with practice, you will become more and more comfortable with analyzing algorithms on your own.

### Common Complexities (Best → Worst)

| Complexity | Name | Example |
|---|---|---|
| O(1) | Constant | Array access |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Single loop |
| O(n log n) | Linearithmic | Merge sort |
| O(n²) | Quadratic | Nested loops |
| O(2ⁿ) | Exponential | Recursion without memo |

---

## Analyzing Code Examples

Let's analyze a simple example: finding the maximum element in an array.

\`\`\`java
public int findMax(int[] nums) {
    int maximum = Integer.MIN_VALUE; // O(1)
    for (int num : nums) {          // O(n) iterations
        if (num > maximum) {        // O(1) comparison
            maximum = num;          // O(1) assignment
        }
    }
    return maximum;                 // O(1)
}
\`\`\`

**Total time complexity**: O(n)  
**Space complexity**: O(1) — only one extra variable \`maximum\`
`;

const TWO_POINTERS_CONTENT = `
## Two Pointers

Two pointers is an extremely common technique used to solve array and string problems. It involves having two integer variables that both move along an iterable.

### When to use Two Pointers?

The two-pointer technique is best used when:
- The input is an array or string
- The problem involves finding pairs, subarrays, or subsequences
- The data is sorted (or can be sorted)

### Example 1: Check for Palindrome

\`\`\`java
class Solution {
    public boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                return false;
            }
            left++;
            right--;
        }
        
        return true;
    }
}
\`\`\`

**Time complexity**: O(n)  
**Space complexity**: O(1)

### Example 2: Two Sum (Sorted Array)

Given a **sorted** array, find two numbers that add up to a target.

\`\`\`java
public int[] twoSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) {
            return new int[]{left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    
    return new int[]{-1, -1};
}
\`\`\`

**Time complexity**: O(n)  
**Space complexity**: O(1)

---

## Key Insight

The two pointers technique turns what would normally be an O(n²) nested loop solution into an O(n) solution by taking advantage of the sorted order or specific properties of the data.
`;

export const COURSES: Record<string, CourseData> = {
  dsa: {
    id: "dsa",
    title: "Data Structures & Algorithms",
    subtitle: "Cours Crash Course",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
    accentColor: "#a78bfa",
    totalItems: 149,
    chapters: [
      {
        id: "introduction",
        title: "Introduction",
        description: "Before we start the course, let's first...",
        lessons: [
          { id: "testimonials", title: "Testimonials", type: "article", content: "# Testimonials\n\nHere are some testimonials from students who have completed this course." },
          { id: "big-o", title: "Introduction to big O", type: "article", content: DSA_INTRO_BIG_O },
          { id: "recursion", title: "Introduction to recursion", type: "article", locked: true },
          { id: "notes", title: "Notes before starting", type: "article", locked: true },
        ],
      },
      {
        id: "arrays-strings",
        title: "Arrays and Strings",
        description: "Arrays and strings are two of the most common data structures...",
        lessons: [
          { id: "arrays-intro", title: "Arrays and strings", type: "article", content: "# Arrays and Strings\n\nArrays and strings are two of the most fundamental data structures in computer science." },
          { id: "two-pointers", title: "Two pointers", type: "article", content: TWO_POINTERS_CONTENT },
          { id: "reverse-string", title: "Reverse String", type: "exercise", locked: true },
          { id: "squares-sorted", title: "Squares of a Sorted Array", type: "exercise", locked: true },
          { id: "sliding-window", title: "Sliding Window", type: "article", content: "# Sliding Window\n\nThe sliding window technique is used to process sequential data, arrays, strings etc." },
          { id: "max-avg-subarray", title: "Maximum Average Subarray I", type: "exercise", locked: true },
          { id: "min-consecutive", title: "Min Consecutive Ones II", type: "exercise", locked: true },
          { id: "prefix-sum", title: "Prefix Sum", type: "article", content: "# Prefix Sum\n\nA prefix sum (also known as a cumulative sum) is a sequence of partial sums of a given sequence." },
          { id: "running-sum", title: "Running Sum of 1D Array", type: "exercise" },
          { id: "min-val-positive", title: "Minimum Value to Get Positive", type: "exercise", locked: true },
          { id: "k-radius", title: "K Radius Subarray Averages", type: "exercise", locked: true },
          { id: "more-patterns", title: "More common patterns", type: "article", content: "# More Common Patterns\n\nLet's explore more advanced array patterns." },
          { id: "arrays-quiz", title: "Array and strings quiz", type: "quiz" },
          { id: "linear-problems", title: "Linear problems: arrays and strings", type: "exercise", locked: true },
        ],
      },
      {
        id: "hashing",
        title: "Hashing",
        description: "Hashing can be used to implement...",
        lessons: [
          { id: "hash-intro", title: "Hashing", type: "article", locked: true },
          { id: "two-sum-hash", title: "Two Sum", type: "exercise", locked: true },
          { id: "ransom-note", title: "Ransom Note", type: "exercise", locked: true },
        ],
      },
      {
        id: "linked-lists",
        title: "Linked lists",
        description: "A linked list is like a chain — each...",
        lessons: [
          { id: "linked-intro", title: "Linked Lists", type: "article", locked: true },
          { id: "reverse-list", title: "Reverse Linked List", type: "exercise", locked: true },
        ],
      },
      {
        id: "stacks-queues",
        title: "Stacks and queues",
        description: "Stacks and queues are data structures...",
        lessons: [
          { id: "stack-intro", title: "Stacks and Queues", type: "article", locked: true },
          { id: "valid-parens", title: "Valid Parentheses", type: "exercise", locked: true },
        ],
      },
      {
        id: "trees-graphs",
        title: "Trees and graphs",
        description: "Trees and graphs are arguably the...",
        lessons: [
          { id: "trees-intro", title: "Trees and Graphs", type: "article", locked: true },
          { id: "bfs", title: "Binary Tree BFS", type: "article", locked: true },
          { id: "dfs", title: "Binary Tree DFS", type: "article", locked: true },
        ],
      },
      {
        id: "heaps",
        title: "Heaps",
        description: "A priority queue. Commonly impl...",
        lessons: [
          { id: "heap-intro", title: "Heaps / Priority Queues", type: "article", locked: true },
          { id: "kth-largest", title: "Kth Largest Element in Array", type: "exercise", locked: true },
        ],
      },
      {
        id: "greedy",
        title: "Greedy",
        description: "Greedy is more of a problem-solv...",
        lessons: [
          { id: "greedy-intro", title: "Greedy Algorithms", type: "article", locked: true },
          { id: "jump-game", title: "Jump Game", type: "exercise", locked: true },
        ],
      },
      {
        id: "binary-search",
        title: "Binary search",
        description: "Binary search is an extremely el...",
        lessons: [
          { id: "binary-intro", title: "Binary Search", type: "article", locked: true },
          { id: "search-sorted", title: "Search in Rotated Sorted Array", type: "exercise", locked: true },
        ],
      },
      {
        id: "backtracking",
        title: "Backtracking",
        description: "Backtracking is a general method...",
        lessons: [
          { id: "backtrack-intro", title: "Backtracking", type: "article", locked: true },
          { id: "permutations", title: "Permutations", type: "exercise", locked: true },
        ],
      },
      {
        id: "dynamic-programming",
        title: "Dynamic programming",
        description: "Dynamic programming is a technique...",
        lessons: [
          { id: "dp-intro", title: "Dynamic Programming", type: "article", locked: true },
          { id: "climbing-stairs", title: "Climbing Stairs", type: "exercise", locked: true },
          { id: "house-robber", title: "House Robber", type: "exercise", locked: true },
        ],
      },
    ],
  },
  sql: {
    id: "sql",
    title: "SQL Language",
    subtitle: "Explication détaillée",
    gradient: "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)",
    accentColor: "#38bdf8",
    totalItems: 36,
    chapters: [
      {
        id: "sql-basics",
        title: "SQL Basics",
        description: "Introduction to SQL and relational databases.",
        lessons: [
          { id: "what-is-sql", title: "What is SQL?", type: "article", content: "# What is SQL?\n\nSQL (Structured Query Language) is a standard language for managing relational databases." },
          { id: "select", title: "SELECT Statement", type: "article", content: "# SELECT Statement\n\nThe SELECT statement is used to fetch data from a database." },
          { id: "where", title: "WHERE Clause", type: "article", content: "# WHERE Clause\n\nThe WHERE clause is used to filter records." },
          { id: "sql-quiz-1", title: "Basic SQL Quiz", type: "quiz" },
        ],
      },
      {
        id: "sql-joins",
        title: "Joins",
        description: "Combining data from multiple tables.",
        lessons: [
          { id: "inner-join", title: "INNER JOIN", type: "article", locked: true },
          { id: "left-join", title: "LEFT JOIN", type: "article", locked: true },
          { id: "right-join", title: "RIGHT JOIN", type: "article", locked: true },
        ],
      },
      {
        id: "sql-advanced",
        title: "Advanced SQL",
        description: "Window functions, CTEs, and more.",
        lessons: [
          { id: "group-by", title: "GROUP BY & HAVING", type: "article", locked: true },
          { id: "window-funcs", title: "Window Functions", type: "article", locked: true },
          { id: "cte", title: "Common Table Expressions", type: "article", locked: true },
        ],
      },
    ],
  },
  graph: {
    id: "graph",
    title: "Graph",
    subtitle: "Explication détaillée",
    gradient: "linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)",
    accentColor: "#86efac",
    totalItems: 58,
    chapters: [
      {
        id: "graph-basics",
        title: "Graph Basics",
        description: "Introduction to graphs and their representations.",
        lessons: [
          { id: "graph-intro", title: "Introduction to Graphs", type: "article", content: "# Introduction to Graphs\n\nA graph is a collection of nodes (vertices) connected by edges." },
          { id: "graph-repr", title: "Graph Representations", type: "article", content: "# Graph Representations\n\nGraphs can be represented as adjacency lists or adjacency matrices." },
          { id: "bfs-graph", title: "BFS on Graphs", type: "article", locked: true },
          { id: "dfs-graph", title: "DFS on Graphs", type: "article", locked: true },
        ],
      },
      {
        id: "graph-algorithms",
        title: "Graph Algorithms",
        description: "Classic algorithms on graphs.",
        lessons: [
          { id: "dijkstra", title: "Dijkstra's Algorithm", type: "article", locked: true },
          { id: "topological", title: "Topological Sort", type: "article", locked: true },
          { id: "union-find", title: "Union Find", type: "article", locked: true },
        ],
      },
    ],
  },
  "system-design": {
    id: "system-design",
    title: "System Design for Interviews and Beyond",
    subtitle: "Cours Crash Course",
    gradient: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
    accentColor: "#34d399",
    totalItems: 81,
    chapters: [
      {
        id: "sys-intro",
        title: "Introduction",
        description: "Introduction to scalability and system architecture.",
        lessons: [
          { id: "sys-welcome", title: "Welcome to System Design", type: "article", content: "# Welcome to System Design\n\nSystem design is the process of defining the architecture, interfaces, and data for a system that satisfies specific requirements." }
        ]
      }
    ]
  },
  beginner: {
    id: "beginner",
    title: "The Beginner's Guide to Algorithms",
    subtitle: "Collection d'introduction",
    gradient: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
    accentColor: "#fdba74",
    totalItems: 17,
    chapters: [
      {
        id: "beg-intro",
        title: "Introduction",
        description: "The very basics of problem solving.",
        lessons: [
          { id: "beg-welcome", title: "Getting Started", type: "article", content: "# Getting Started\n\nWelcome to algorithms! Let's learn how to think step by step." }
        ]
      }
    ]
  },
  "top-interview": {
    id: "top-interview",
    title: "Top Interview Questions",
    subtitle: "Easy Collection",
    gradient: "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
    accentColor: "#67e8f9",
    totalItems: 48,
    chapters: [
      {
        id: "top-intro",
        title: "Common Questions",
        description: "Most asked questions in technical interviews.",
        lessons: [
          { id: "top-welcome", title: "Overview", type: "article", content: "# Top Interview Questions\n\nThis course groups the most popular questions asked during frontend, backend, and fullstack interviews." }
        ]
      }
    ]
  },
  dp: {
    id: "dp",
    title: "Dynamic Programming",
    subtitle: "Explication détaillée",
    gradient: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
    accentColor: "#5eead4",
    totalItems: 55,
    chapters: [
      {
        id: "dp-intro-chap",
        title: "Introduction to DP",
        description: "Understanding memoization and tabulations.",
        lessons: [
          { id: "dp-welcome", title: "What is DP?", type: "article", content: "# What is Dynamic Programming?\n\nDynamic Programming (DP) is an algorithmic technique for solving an optimization problem by breaking it down into simpler subproblems." }
        ]
      }
    ]
  },
  arrays: {
    id: "arrays",
    title: "Arrays 101",
    subtitle: "Introduction aux structures",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
    accentColor: "#93c5fd",
    totalItems: 31,
    chapters: [
      {
        id: "arr-intro-chap",
        title: "Introduction",
        description: "Memory allocation and indexing of arrays.",
        lessons: [
          { id: "arr-welcome", title: "Welcome to Arrays 101", type: "article", content: "# Arrays 101\n\nLearn what arrays are, how they are stored in memory, and common operations on them." }
        ]
      }
    ]
  },
  cheatsheets: {
    id: "cheatsheets",
    title: "Cheatsheets",
    subtitle: "Référence rapide",
    gradient: "linear-gradient(135deg, #3730a3 0%, #4338ca 50%, #6366f1 100%)",
    accentColor: "#a5b4fc",
    totalItems: 3,
    chapters: [
      {
        id: "cheat-intro-chap",
        title: "Quick Sheets",
        description: "Fast review sheets for interviews.",
        lessons: [
          { id: "cheat-welcome", title: "Technical Cheatsheet", type: "article", content: "# Technical Cheatsheet\n\nQuick cheatsheet summarizing time/space complexities of popular algorithms." }
        ]
      }
    ]
  },
  heap: {
    id: "heap",
    title: "Heap",
    subtitle: "Explication détaillée",
    gradient: "linear-gradient(135deg, #9d174d 0%, #be185d 50%, #db2777 100%)",
    accentColor: "#f9a8d4",
    totalItems: 28,
    chapters: [
      {
        id: "heap-intro-chap",
        title: "Heaps 101",
        description: "Priority queues and binary heaps.",
        lessons: [
          { id: "heap-welcome", title: "Introduction to Heaps", type: "article", content: "# Introduction to Heaps\n\nA Heap is a special Tree-based data structure in which the tree is a complete binary tree." }
        ]
      }
    ]
  },
  "bit-manip": {
    id: "bit-manip",
    title: "Bit Manipulation",
    subtitle: "Explication détaillée",
    gradient: "linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)",
    accentColor: "#fcd34d",
    totalItems: 22,
    chapters: [
      {
        id: "bit-intro-chap",
        title: "Bits and Bytes",
        description: "Bitwise operators and operations.",
        lessons: [
          { id: "bit-welcome", title: "Introduction to Bitwise Operators", type: "article", content: "# Bit Manipulation\n\nLearn how numbers are represented in binary and how to use bitwise operations (AND, OR, XOR, NOT, shift)." }
        ]
      }
    ]
  }
};
