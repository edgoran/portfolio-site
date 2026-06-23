window.blogDiveData = {
    linux: {
        icon: "🐧",
        title: "Linux Commands",
        summary: "Essential commands for navigating and managing a Linux system.",
        sections: [
            {
                heading: "Navigation",
                items: [
                    {
                        type: "command",
                        command: "pwd",
                        description: "Print working directory. Shows the full path of where you currently are."
                    },
                    {
                        type: "command",
                        command: "ls",
                        description: "List directory contents."
                    },
                    {
                        type: "command",
                        command: "ls -la",
                        description: "List all files including hidden ones, with detailed information (permissions, owner, size, date)."
                    },
                    {
                        type: "command",
                        command: "cd /path/to/directory",
                        description: "Change directory. Navigate to a specific path."
                    },
                    {
                        type: "command",
                        command: "cd ..",
                        description: "Go up one directory level."
                    },
                    {
                        type: "command",
                        command: "cd ~",
                        description: "Go to your home directory."
                    },
                    {
                        type: "command",
                        command: "cd -",
                        description: "Go back to the previous directory you were in."
                    }
                ]
            },
            {
                heading: "File Operations",
                items: [
                    {
                        type: "command",
                        command: "cat file.txt",
                        description: "Display the entire contents of a file."
                    },
                    {
                        type: "command",
                        command: "less file.txt",
                        description: "View a file with scrolling. Press q to quit. Better than cat for large files."
                    },
                    {
                        type: "command",
                        command: "head -n 10 file.txt",
                        description: "Show the first 10 lines of a file."
                    },
                    {
                        type: "command",
                        command: "tail -n 10 file.txt",
                        description: "Show the last 10 lines of a file."
                    },
                    {
                        type: "command",
                        command: "tail -f file.txt",
                        description: "Follow a file in real time. New lines appear as they're written. Perfect for watching logs."
                    },
                    {
                        type: "command",
                        command: "cp source.txt destination.txt",
                        description: "Copy a file."
                    },
                    {
                        type: "command",
                        command: "mv old-name.txt new-name.txt",
                        description: "Move or rename a file."
                    },
                    {
                        type: "command",
                        command: "rm file.txt",
                        description: "Delete a file. No recycle bin, it's gone."
                    },
                    {
                        type: "command",
                        command: "rm -rf directory/",
                        description: "Delete a directory and everything inside it recursively. Use with extreme caution."
                    },
                    {
                        type: "command",
                        command: "touch file.txt",
                        description: "Create an empty file, or update the timestamp of an existing file."
                    },
                    {
                        type: "command",
                        command: "mkdir new-folder",
                        description: "Create a new directory."
                    },
                    {
                        type: "command",
                        command: "mkdir -p path/to/nested/folder",
                        description: "Create nested directories in one go. Creates parent directories if they don't exist."
                    }
                ]
            },
            {
                heading: "Searching & Filtering",
                items: [
                    {
                        type: "command",
                        command: "grep 'pattern' file.txt",
                        description: "Search for text matching a pattern in a file. Returns matching lines."
                    },
                    {
                        type: "command",
                        command: "grep -r 'pattern' /directory",
                        description: "Search recursively through all files in a directory."
                    },
                    {
                        type: "command",
                        command: "grep -i 'pattern' file.txt",
                        description: "Case-insensitive search."
                    },
                    {
                        type: "command",
                        command: "find /path -name '*.txt'",
                        description: "Find files by name. Supports wildcards."
                    },
                    {
                        type: "command",
                        command: "find /path -mtime -7",
                        description: "Find files modified in the last 7 days."
                    },
                    {
                        type: "command",
                        command: "cat log.txt | grep 'error' | wc -l",
                        description: "Pipe (|) sends output of one command to another. This counts the number of lines containing 'error'."
                    }
                ]
            },
            {
                heading: "Permissions",
                items: [
                    {
                        type: "info",
                        text: "Every file has permissions for three groups: owner, group, and others. Each group can have read (r=4), write (w=2), and execute (x=1) permissions. Numbers are added together, so 7 = rwx, 5 = rx, 0 = nothing."
                    },
                    {
                        type: "command",
                        command: "chmod 755 script.sh",
                        description: "Owner: read/write/execute. Group: read/execute. Others: read/execute. Common for scripts."
                    },
                    {
                        type: "command",
                        command: "chmod 600 secret.key",
                        description: "Owner: read/write. Everyone else: nothing. Common for private keys."
                    },
                    {
                        type: "command",
                        command: "chmod +x script.sh",
                        description: "Add execute permission. Required before you can run a script."
                    },
                    {
                        type: "command",
                        command: "chown user:group file.txt",
                        description: "Change the owner and group of a file."
                    }
                ]
            },
            {
                heading: "Process Management",
                items: [
                    {
                        type: "command",
                        command: "ps aux",
                        description: "List all running processes with details."
                    },
                    {
                        type: "command",
                        command: "top",
                        description: "Interactive real-time process viewer. Shows CPU, memory usage. Press q to quit."
                    },
                    {
                        type: "command",
                        command: "htop",
                        description: "Better version of top with colour and mouse support. May need to be installed separately."
                    },
                    {
                        type: "command",
                        command: "kill 1234",
                        description: "Send terminate signal to process with PID 1234. Asks it to shut down gracefully."
                    },
                    {
                        type: "command",
                        command: "kill -9 1234",
                        description: "Force kill a process. Use when normal kill doesn't work. Process gets no chance to clean up."
                    },
                    {
                        type: "command",
                        command: "systemctl start nginx",
                        description: "Start a service."
                    },
                    {
                        type: "command",
                        command: "systemctl stop nginx",
                        description: "Stop a service."
                    },
                    {
                        type: "command",
                        command: "systemctl restart nginx",
                        description: "Restart a service."
                    },
                    {
                        type: "command",
                        command: "systemctl status nginx",
                        description: "Check if a service is running and see recent logs."
                    },
                    {
                        type: "command",
                        command: "systemctl enable nginx",
                        description: "Set a service to start automatically on boot."
                    },
                    {
                        type: "command",
                        command: "journalctl -u nginx",
                        description: "View logs for a specific service."
                    }
                ]
            },
            {
                heading: "Networking",
                items: [
                    {
                        type: "command",
                        command: "curl https://example.com",
                        description: "Make an HTTP request and display the response. Great for testing APIs."
                    },
                    {
                        type: "command",
                        command: "wget https://example.com/file.zip",
                        description: "Download a file from a URL."
                    },
                    {
                        type: "command",
                        command: "ping google.com",
                        description: "Test connectivity to a host. Shows round-trip time. Ctrl+C to stop."
                    },
                    {
                        type: "command",
                        command: "dig example.com",
                        description: "DNS lookup. Shows the IP address and DNS records for a domain."
                    },
                    {
                        type: "command",
                        command: "ss -tlnp",
                        description: "Show all listening TCP ports and which processes are using them."
                    },
                    {
                        type: "command",
                        command: "ssh user@192.168.1.10",
                        description: "Connect to a remote machine via SSH."
                    },
                    {
                        type: "command",
                        command: "scp file.txt user@host:/path/",
                        description: "Securely copy a file to a remote machine."
                    }
                ]
            },
            {
                heading: "Disk & Storage",
                items: [
                    {
                        type: "command",
                        command: "df -h",
                        description: "Show disk space usage in human-readable format."
                    },
                    {
                        type: "command",
                        command: "du -sh /path",
                        description: "Show the total size of a directory."
                    },
                    {
                        type: "command",
                        command: "lsblk",
                        description: "List all block devices (disks, partitions, USB drives)."
                    }
                ]
            },
            {
                heading: "Shortcuts & Tricks",
                items: [
                    {
                        type: "command",
                        command: "Ctrl+C",
                        description: "Cancel the current running command."
                    },
                    {
                        type: "command",
                        command: "Ctrl+R",
                        description: "Search your command history. Start typing to find previous commands."
                    },
                    {
                        type: "command",
                        command: "!!",
                        description: "Repeat the last command. Useful with: sudo !!"
                    },
                    {
                        type: "command",
                        command: "command > file.txt",
                        description: "Redirect output to a file (overwrites existing content)."
                    },
                    {
                        type: "command",
                        command: "command >> file.txt",
                        description: "Redirect output to a file (appends to existing content)."
                    },
                    {
                        type: "command",
                        command: "command 2>&1",
                        description: "Redirect error output (stderr) to the same place as normal output (stdout)."
                    },
                    {
                        type: "command",
                        command: "command &",
                        description: "Run a command in the background. Terminal remains usable."
                    },
                    {
                        type: "command",
                        command: "nohup command &",
                        description: "Run in background AND survive logout. Process continues even if you close the terminal."
                    }
                ]
            }
        ]
    },
    networking: {
        icon: "🌐",
        title: "Networking Fundamentals",
        summary: "Understanding how data moves across networks and the protocols that make it happen.",
        sections: [
            {
                heading: "TCP vs UDP",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "TCP (Transmission Control Protocol)",
                            points: [
                                "Connection-based (three-way handshake)",
                                "Guarantees delivery and ordering",
                                "Retransmits lost packets",
                                "Slower due to overhead",
                                "Used for: web, email, file transfer, SSH"
                            ]
                        },
                        right: {
                            title: "UDP (User Datagram Protocol)",
                            points: [
                                "Connectionless (fire and forget)",
                                "No guarantee of delivery or order",
                                "No retransmission",
                                "Faster, less overhead",
                                "Used for: streaming, gaming, DNS, VoIP"
                            ]
                        }
                    },
                    {
                        type: "info",
                        text: "Choose TCP when data integrity matters (you need every packet, in order). Choose UDP when speed matters more than perfect delivery (a dropped video frame is better than a delayed one)."
                    }
                ]
            },
            {
                heading: "TCP Three-Way Handshake",
                items: [
                    {
                        type: "steps",
                        steps: [
                            "Client sends SYN (synchronise) to server",
                            "Server responds with SYN-ACK (synchronise-acknowledge)",
                            "Client sends ACK (acknowledge)"
                        ],
                        footer: "Connection is now established. Both sides agree on initial sequence numbers and data can flow both ways."
                    }
                ]
            },
            {
                heading: "HTTP / HTTPS",
                items: [
                    {
                        type: "definition",
                        term: "HTTP (HyperText Transfer Protocol)",
                        definition: "The foundation of web communication. A request-response protocol: client sends a request (GET, POST, PUT, DELETE), server sends a response with a status code and body."
                    },
                    {
                        type: "definition",
                        term: "HTTPS",
                        definition: "HTTP with TLS/SSL encryption. Data is encrypted in transit so anyone intercepting the traffic sees gibberish instead of plain text. Standard for all modern websites."
                    }
                ]
            },
            {
                heading: "HTTP Status Codes",
                items: [
                    {
                        type: "definition",
                        term: "2xx - Success",
                        definition: "200 OK, 201 Created, 204 No Content"
                    },
                    {
                        type: "definition",
                        term: "3xx - Redirection",
                        definition: "301 Moved Permanently, 304 Not Modified"
                    },
                    {
                        type: "definition",
                        term: "4xx - Client Error",
                        definition: "400 Bad Request, 401 Unauthorised, 403 Forbidden, 404 Not Found, 429 Too Many Requests"
                    },
                    {
                        type: "definition",
                        term: "5xx - Server Error",
                        definition: "500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable"
                    }
                ]
            },
            {
                heading: "SSH (Secure Shell)",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Encrypted remote access to a machine over port 22. Replaces older insecure protocols like Telnet."
                    },
                    {
                        type: "definition",
                        term: "Password authentication",
                        definition: "Simple but less secure. Vulnerable to brute force attacks."
                    },
                    {
                        type: "definition",
                        term: "Key-based authentication",
                        definition: "Generate a public/private key pair. Public key goes on the server (~/.ssh/authorized_keys). Client proves identity using the private key without ever sending it over the network. Much more secure."
                    }
                ]
            },
            {
                heading: "DNS (Domain Name System)",
                items: [
                    {
                        type: "info",
                        text: "Translates human-readable domain names (google.com) into IP addresses (142.250.187.46). Often called the phonebook of the internet."
                    },
                    {
                        type: "steps",
                        steps: [
                            "Browser checks local cache",
                            "OS checks its cache",
                            "Query goes to recursive resolver (usually your ISP)",
                            "Resolver asks root nameservers",
                            "Root directs to TLD nameservers (.com, .co.uk)",
                            "TLD directs to authoritative nameservers for the domain",
                            "IP address returned and cached at each level"
                        ],
                        footer: "This whole process typically takes milliseconds."
                    },
                    {
                        type: "definition",
                        term: "A Record",
                        definition: "Maps domain to IPv4 address"
                    },
                    {
                        type: "definition",
                        term: "AAAA Record",
                        definition: "Maps domain to IPv6 address"
                    },
                    {
                        type: "definition",
                        term: "CNAME Record",
                        definition: "Alias pointing one domain to another"
                    },
                    {
                        type: "definition",
                        term: "MX Record",
                        definition: "Directs email to mail servers"
                    },
                    {
                        type: "definition",
                        term: "TXT Record",
                        definition: "Arbitrary text, often used for domain verification"
                    }
                ]
            },
            {
                heading: "Ports",
                items: [
                    {
                        type: "info",
                        text: "Ports are logical endpoints for network communication. A single IP address can have 65,535 ports. Think of the IP address as a building and ports as individual rooms."
                    },
                    {
                        type: "definition",
                        term: "22",
                        definition: "SSH"
                    },
                    {
                        type: "definition",
                        term: "80",
                        definition: "HTTP"
                    },
                    {
                        type: "definition",
                        term: "443",
                        definition: "HTTPS"
                    },
                    {
                        type: "definition",
                        term: "1433",
                        definition: "SQL Server"
                    },
                    {
                        type: "definition",
                        term: "3306",
                        definition: "MySQL"
                    },
                    {
                        type: "definition",
                        term: "5432",
                        definition: "PostgreSQL"
                    },
                    {
                        type: "definition",
                        term: "3389",
                        definition: "RDP (Remote Desktop)"
                    }
                ]
            },
            {
                heading: "TLS/SSL Handshake",
                items: [
                    {
                        type: "steps",
                        steps: [
                            "Client sends supported cipher suites to server",
                            "Server responds with chosen cipher suite and its SSL certificate",
                            "Client verifies certificate against trusted Certificate Authorities",
                            "Both sides generate session keys using asymmetric encryption",
                            "All subsequent data encrypted with symmetric encryption using session keys"
                        ],
                        footer: "This is why HTTPS has slightly more initial latency than HTTP, but once the handshake is done, the symmetric encryption is fast."
                    }
                ]
            }
        ]
    },
    algorithms: {
        icon: "🧮",
        title: "Algorithms & Patterns",
        summary: "Common coding patterns and techniques for solving problems efficiently.",
        sections: [
            {
                heading: "Sliding Window",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Maintain a 'window' over a contiguous portion of data using left and right pointers. Expand right to include new elements, shrink left when a condition is violated."
                    },
                    {
                        type: "definition",
                        term: "When to use",
                        definition: "Problems involving contiguous subarrays or substrings. 'Find the longest/shortest substring that...' is almost always sliding window."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// Example: Longest substring without repeating characters\nvar lastSeen = new Dictionary<char, int>();\nint longest = 0, left = 0;\n\nfor (int right = 0; right < s.Length; right++)\n{\n    char c = s[right];\n    if (lastSeen.ContainsKey(c) && lastSeen[c] >= left)\n        left = lastSeen[c] + 1;\n\n    lastSeen[c] = right;\n    longest = Math.Max(longest, right - left + 1);\n}\nreturn longest;"
                    },
                    {
                        type: "info",
                        text: "Time complexity: typically O(n) instead of O(n²). Each element is visited at most twice (once by right, once by left)."
                    }
                ]
            },
            {
                heading: "Two Pointers",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Use two pointers moving through a data structure, often from opposite ends or at different speeds."
                    },
                    {
                        type: "definition",
                        term: "When to use",
                        definition: "Sorted arrays (find pairs summing to target), removing duplicates in-place, palindrome checking, merging sorted arrays."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// Example: Two numbers in sorted array that sum to target\nint left = 0, right = nums.Length - 1;\n\nwhile (left < right)\n{\n    int sum = nums[left] + nums[right];\n    if (sum == target) return new int[] { left, right };\n    else if (sum < target) left++;\n    else right--;\n}"
                    }
                ]
            },
            {
                heading: "Hash Map Pattern",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Use a Dictionary for O(1) lookups to avoid nested loops. Trade space for time."
                    },
                    {
                        type: "definition",
                        term: "When to use",
                        definition: "Counting frequency, finding pairs (Two Sum), grouping items (anagrams), caching seen values, checking for duplicates."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// Example: Two Sum (find indices of pair summing to target)\nvar seen = new Dictionary<int, int>();\n\nfor (int i = 0; i < nums.Length; i++)\n{\n    int complement = target - nums[i];\n    if (seen.ContainsKey(complement))\n        return new int[] { seen[complement], i };\n    seen[nums[i]] = i;\n}"
                    },
                    {
                        type: "info",
                        text: "Reduces O(n²) brute force (two nested loops) to O(n) with O(n) extra space."
                    }
                ]
            },
            {
                heading: "Binary Search",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Repeatedly halve the search space by comparing the middle element. Only works on sorted data."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "int left = 0, right = nums.Length - 1;\n\nwhile (left <= right)\n{\n    int mid = left + (right - left) / 2;\n\n    if (nums[mid] == target) return mid;\n    else if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n}\nreturn -1;"
                    },
                    {
                        type: "info",
                        text: "Time: O(log n). Use 'left + (right - left) / 2' instead of '(left + right) / 2' to avoid integer overflow."
                    }
                ]
            },
            {
                heading: "Expand From Centre",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "For palindrome problems. Every palindrome has a centre. For each possible centre, expand outward while characters match."
                    },
                    {
                        type: "definition",
                        term: "Key detail",
                        definition: "Must handle two cases: odd-length palindromes have a single centre ('aba') and even-length have a centre between two characters ('abba')."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// For each index, try both odd and even expansions\nfor (int i = 0; i < s.Length; i++)\n{\n    string odd = Expand(s, i, i);      // odd: \"aba\"\n    string even = Expand(s, i, i + 1); // even: \"abba\"\n    // keep the longest\n}\n\nstring Expand(string s, int left, int right)\n{\n    while (left >= 0 && right < s.Length && s[left] == s[right])\n    {\n        left--;\n        right++;\n    }\n    return s.Substring(left + 1, right - left - 1);\n}"
                    },
                    {
                        type: "info",
                        text: "Time: O(n²). Simple to implement and cache-friendly."
                    }
                ]
            },
            {
                heading: "Kadane's Algorithm",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Finds the maximum sum contiguous subarray in O(n). At each position, decide: extend the current subarray or start fresh here?"
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "int currentSum = nums[0];\nint maxSum = nums[0];\n\nfor (int i = 1; i < nums.Length; i++)\n{\n    currentSum = Math.Max(nums[i], currentSum + nums[i]);\n    maxSum = Math.Max(maxSum, currentSum);\n}\nreturn maxSum;"
                    },
                    {
                        type: "info",
                        text: "Key insight: if the running sum becomes negative, it can never help a future subarray, so start over."
                    }
                ]
            },
            {
                heading: "Stack Pattern",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Use a stack (LIFO) when you need to match or track nested/paired structures."
                    },
                    {
                        type: "definition",
                        term: "When to use",
                        definition: "Valid parentheses, evaluate expressions, undo operations, DFS traversal, monotonic sequences."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// Example: Valid parentheses\nvar stack = new Stack<char>();\nvar pairs = new Dictionary<char, char>\n    { {')', '('}, {'}', '{'}, {']', '['} };\n\nforeach (char c in s)\n{\n    if (pairs.ContainsKey(c))\n    {\n        if (stack.Count == 0 || stack.Peek() != pairs[c])\n            return false;\n        stack.Pop();\n    }\n    else stack.Push(c);\n}\nreturn stack.Count == 0;"
                    }
                ]
            },
            {
                heading: "Big O Notation",
                items: [
                    {
                        type: "definition",
                        term: "O(1) - Constant",
                        definition: "Same speed regardless of input size. Hash map lookup, array access by index."
                    },
                    {
                        type: "definition",
                        term: "O(log n) - Logarithmic",
                        definition: "Halves the problem each step. Binary search."
                    },
                    {
                        type: "definition",
                        term: "O(n) - Linear",
                        definition: "Proportional to input size. Single loop through data."
                    },
                    {
                        type: "definition",
                        term: "O(n log n) - Linearithmic",
                        definition: "Efficient sorting algorithms (merge sort, quick sort)."
                    },
                    {
                        type: "definition",
                        term: "O(n²) - Quadratic",
                        definition: "Nested loops. Gets slow fast. Brute force pair-finding."
                    },
                    {
                        type: "definition",
                        term: "O(2^n) - Exponential",
                        definition: "Doubles with each input. Recursive solutions without memoisation."
                    },
                    {
                        type: "info",
                        text: "Always consider both time AND space complexity. Often you can trade space for time (using a hash map to avoid nested loops)."
                    }
                ]
            }
        ]
    },
    datastructures: {
        icon: "🏗️",
        title: "Data Structures",
        summary: "Core data structures, how they work in C#, and when to use each one.",
        sections: [
            {
                heading: "Arrays / Lists",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Contiguous block of memory. Elements stored next to each other with integer indices."
                    },
                    {
                        type: "definition",
                        term: "Performance",
                        definition: "O(1) access by index. O(1) append to end (amortised). O(n) insert/delete in middle (elements must shift)."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// Fixed size array\nint[] arr = new int[5];\narr[0] = 10;\n\n// Dynamic list (resizable)\nvar list = new List<int>();\nlist.Add(10);\nlist.Count;\nlist[0];"
                    },
                    {
                        type: "definition",
                        term: "Use when",
                        definition: "Fast random access needed, iterating sequentially, or you know the approximate size."
                    }
                ]
            },
            {
                heading: "Linked Lists",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Chain of nodes. Each node holds a value and a pointer to the next node. Not stored contiguously in memory."
                    },
                    {
                        type: "definition",
                        term: "Performance",
                        definition: "O(1) insert/delete at a known position (re-point references). O(n) access by index (must traverse from head)."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "// Node structure\npublic class ListNode\n{\n    public int Val;\n    public ListNode Next;\n    public ListNode(int val) { Val = val; }\n}\n\n// Traversal\nListNode current = head;\nwhile (current != null)\n{\n    Console.Write(current.Val);\n    current = current.Next;\n}"
                    },
                    {
                        type: "definition",
                        term: "Use when",
                        definition: "Frequent insertions/deletions, building queues, or when you don't know the size upfront."
                    },
                    {
                        type: "info",
                        text: "Common trick: use a 'dummy head' node when building a new linked list to avoid special-case logic for the first node."
                    }
                ]
            },
            {
                heading: "Stacks (LIFO)",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Last In, First Out. Like a stack of plates: you can only add/remove from the top."
                    },
                    {
                        type: "definition",
                        term: "Performance",
                        definition: "O(1) push, pop, and peek. All operations happen at the top only."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "var stack = new Stack<int>();\nstack.Push(1);      // Add to top\nstack.Push(2);\nstack.Peek();       // Look at top: 2\nstack.Pop();        // Remove from top: 2\nstack.Count;        // 1"
                    },
                    {
                        type: "definition",
                        term: "Use when",
                        definition: "Matching pairs (brackets), undo/redo, DFS traversal, tracking nested state."
                    }
                ]
            },
            {
                heading: "Queues (FIFO)",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "First In, First Out. Like a real queue: first person in line gets served first."
                    },
                    {
                        type: "definition",
                        term: "Performance",
                        definition: "O(1) enqueue (add to back) and dequeue (remove from front)."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "var queue = new Queue<int>();\nqueue.Enqueue(1);   // Add to back\nqueue.Enqueue(2);\nqueue.Peek();       // Look at front: 1\nqueue.Dequeue();    // Remove from front: 1\nqueue.Count;        // 1"
                    },
                    {
                        type: "definition",
                        term: "Use when",
                        definition: "Processing items in order, BFS traversal, task scheduling, rate limiting, message queues."
                    }
                ]
            },
            {
                heading: "Dictionary / Hash Map",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Key-value pairs. Uses a hash function to map keys to array indices for near-instant lookup."
                    },
                    {
                        type: "definition",
                        term: "Performance",
                        definition: "O(1) average for lookup, insert, and delete. O(n) worst case if many hash collisions."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "var dict = new Dictionary<string, int>();\ndict[\"apple\"] = 5;            // Add or update\ndict.ContainsKey(\"apple\");    // true\ndict[\"apple\"];                // 5\ndict.Remove(\"apple\");\n\n// Iterate\nforeach (var kvp in dict)\n    Console.Write($\"{kvp.Key}: {kvp.Value}\");"
                    },
                    {
                        type: "definition",
                        term: "Use when",
                        definition: "Fast lookups by key, counting frequency, caching, grouping items, replacing nested loops."
                    }
                ]
            },
            {
                heading: "HashSet",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Like a Dictionary but stores only keys (no values). Automatically prevents duplicates."
                    },
                    {
                        type: "code",
                        language: "csharp",
                        code: "var set = new HashSet<int>();\nset.Add(1);         // true (added)\nset.Add(1);         // false (already exists)\nset.Contains(1);    // true\nset.Remove(1);\nset.Count;"
                    },
                    {
                        type: "definition",
                        term: "Use when",
                        definition: "Checking existence, deduplication, set operations (union, intersection, difference)."
                    }
                ]
            },
            {
                heading: "When to Use What",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "Need...",
                            points: [
                                "Fast access by index",
                                "Fast lookup by key",
                                "Check if something exists",
                                "LIFO order",
                                "FIFO order",
                                "Frequent insert/delete",
                                "Sorted data with fast search"
                            ]
                        },
                        right: {
                            title: "Use...",
                            points: [
                                "Array / List",
                                "Dictionary",
                                "HashSet",
                                "Stack",
                                "Queue",
                                "Linked List",
                                "SortedSet / BST"
                            ]
                        }
                    }
                ]
            }
        ]
    },
    cloud: {
        icon: "☁️",
        title: "Cloud Services (AWS & Azure)",
        summary: "Core cloud networking, security, compute, and storage services with comparisons between AWS and Azure.",
        sections: [
            {
                heading: "VPC / Virtual Network",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "A logically isolated section of the cloud where you launch resources. You define the IP range (CIDR block), create subnets, and control routing."
                    },
                    {
                        type: "definition",
                        term: "Public vs Private Subnets",
                        definition: "Public subnets have a route to an Internet Gateway (resources can reach the internet). Private subnets have no direct internet access (backend services, databases)."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "VPC (Virtual Private Cloud)",
                                "Internet Gateway for public access",
                                "NAT Gateway for private subnet outbound",
                                "VPC Peering to connect VPCs"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "VNet (Virtual Network)",
                                "Public IP + NSG for public access",
                                "NAT Gateway for outbound",
                                "VNet Peering to connect VNets"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "Security Groups",
                items: [
                    {
                        type: "definition",
                        term: "What they are",
                        definition: "Virtual firewalls controlling inbound and outbound traffic at the instance/resource level."
                    },
                    {
                        type: "definition",
                        term: "Stateful",
                        definition: "If you allow inbound traffic on port 443, the response is automatically allowed out. You don't need to create a matching outbound rule."
                    },
                    {
                        type: "definition",
                        term: "Allow-only",
                        definition: "You can only create allow rules. Everything is denied by default. No explicit deny rules."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "Security Groups",
                                "Attached to EC2, Lambda, RDS, etc.",
                                "Can reference other security groups as source"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Network Security Groups (NSGs)",
                                "Attached to NICs or subnets",
                                "Can use service tags as source"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "NACLs (Network Access Control Lists)",
                items: [
                    {
                        type: "definition",
                        term: "What they are",
                        definition: "Firewalls at the subnet level. An additional layer of security on top of security groups."
                    },
                    {
                        type: "definition",
                        term: "Stateless",
                        definition: "Inbound and outbound rules are evaluated independently. You must explicitly allow traffic in BOTH directions."
                    },
                    {
                        type: "definition",
                        term: "Allow AND Deny",
                        definition: "Unlike security groups, NACLs support explicit deny rules. Rules have a priority number and are evaluated in order (lowest number first)."
                    },
                    {
                        type: "info",
                        text: "Think of NACLs as the building's front door security (broad subnet-level rules) and Security Groups as individual office door locks (specific resource-level rules)."
                    }
                ]
            },
            {
                heading: "Security Groups vs NACLs",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "Security Groups",
                            points: [
                                "Stateful",
                                "Instance/resource level",
                                "Allow rules only",
                                "All rules evaluated together",
                                "Applied to specific resources"
                            ]
                        },
                        right: {
                            title: "NACLs",
                            points: [
                                "Stateless",
                                "Subnet level",
                                "Allow AND deny rules",
                                "Rules evaluated in number order",
                                "Applied to entire subnet"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "IAM (Identity and Access Management)",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Controls WHO can do WHAT on WHICH resources. Core principle: least privilege (grant minimum access required)."
                    },
                    {
                        type: "definition",
                        term: "Users",
                        definition: "Individual people or service accounts with permanent credentials."
                    },
                    {
                        type: "definition",
                        term: "Groups",
                        definition: "Collections of users. Attach policies to groups rather than individual users."
                    },
                    {
                        type: "definition",
                        term: "Roles",
                        definition: "Assumed temporarily by services or users. No permanent credentials. Lambda functions, EC2 instances assume roles."
                    },
                    {
                        type: "definition",
                        term: "Policies",
                        definition: "JSON documents defining permissions. Specify Effect (Allow/Deny), Action (what), and Resource (which)."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "IAM Users, Groups, Roles",
                                "JSON policies",
                                "Identity-based and resource-based policies"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Entra ID (formerly Azure AD)",
                                "RBAC (Role-Based Access Control)",
                                "Built-in roles + custom roles"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "Compute",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "EC2 (virtual machines)",
                                "Lambda (serverless functions)",
                                "ECS + Fargate (containers)",
                                "EKS (managed Kubernetes)"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Virtual Machines",
                                "Azure Functions (serverless)",
                                "Container Apps",
                                "AKS (managed Kubernetes)"
                            ]
                        }
                    },
                    {
                        type: "info",
                        text: "Serverless (Lambda/Functions): no servers to manage, pay per invocation, scales automatically, great for event-driven workloads. VMs (EC2/Azure VMs): full control, manage your own OS and patches, better for long-running or stateful workloads."
                    }
                ]
            },
            {
                heading: "Storage",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "S3 (object storage)",
                                "EBS (block storage / VM disks)",
                                "EFS (file storage)"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Blob Storage (object storage)",
                                "Managed Disks (block storage)",
                                "Azure Files (file storage)"
                            ]
                        }
                    },
                    {
                        type: "info",
                        text: "Object storage (S3/Blob): virtually unlimited, accessed via HTTP, great for static sites, backups, media. Storage classes/tiers allow cost optimisation for infrequently accessed data."
                    }
                ]
            },
            {
                heading: "Databases",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "RDS (managed relational: MySQL, PostgreSQL, SQL Server)",
                                "DynamoDB (NoSQL key-value)",
                                "ElastiCache (Redis/Memcached)"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Azure SQL Database (managed relational)",
                                "Cosmos DB (NoSQL, multi-model)",
                                "Azure Cache for Redis"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "Load Balancing",
                items: [
                    {
                        type: "definition",
                        term: "What it does",
                        definition: "Distributes incoming traffic across multiple targets for reliability and performance."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "ALB (Layer 7 / HTTP, path-based routing)",
                                "NLB (Layer 4 / TCP, ultra-low latency)"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Application Gateway (Layer 7)",
                                "Azure Load Balancer (Layer 4)"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "CDN",
                items: [
                    {
                        type: "definition",
                        term: "What it does",
                        definition: "Caches content at edge locations worldwide. User gets served from the nearest location, reducing latency."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: ["CloudFront"]
                        },
                        right: {
                            title: "Azure",
                            points: ["Azure CDN / Front Door"]
                        }
                    }
                ]
            },
            {
                heading: "DNS",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "Route 53",
                                "Routing: Simple, Weighted, Latency, Failover, Geolocation"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Azure DNS",
                                "Traffic Manager for advanced routing"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "Message Queues",
                items: [
                    {
                        type: "definition",
                        term: "What they do",
                        definition: "Decouple services by passing messages through a queue. Handles traffic spikes, prevents data loss, enables async processing."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "SQS (simple queue)",
                                "SNS (pub/sub notifications)",
                                "EventBridge (event bus)"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "Service Bus (queue + topics)",
                                "Queue Storage (simple)",
                                "Event Grid (event routing)"
                            ]
                        }
                    }
                ]
            },
            {
                heading: "Infrastructure as Code",
                items: [
                    {
                        type: "definition",
                        term: "What it is",
                        definition: "Define cloud infrastructure in code rather than clicking through consoles. Repeatable, version controlled, peer reviewable."
                    },
                    {
                        type: "comparison",
                        left: {
                            title: "AWS",
                            points: [
                                "CloudFormation (YAML/JSON)",
                                "CDK (C#, TypeScript, Python compiles to CloudFormation)"
                            ]
                        },
                        right: {
                            title: "Azure",
                            points: [
                                "ARM Templates (JSON)",
                                "Bicep (simplified syntax)"
                            ]
                        }
                    },
                    {
                        type: "info",
                        text: "Terraform is cloud-agnostic and works with both. CDK is particularly nice because you write real code with loops, conditionals, and IDE support."
                    }
                ]
            },
            {
                heading: "Shared Responsibility Model",
                items: [
                    {
                        type: "comparison",
                        left: {
                            title: "Provider Responsible For",
                            points: [
                                "Physical data centres",
                                "Networking hardware",
                                "Hypervisors",
                                "Global infrastructure"
                            ]
                        },
                        right: {
                            title: "Customer Responsible For",
                            points: [
                                "Data and encryption",
                                "IAM / access management",
                                "OS patching (on VMs)",
                                "Firewall / security group rules"
                            ]
                        }
                    },
                    {
                        type: "info",
                        text: "With serverless (Lambda/Functions), the provider handles more (OS, runtime) so the customer's responsibility shrinks. With EC2/VMs, you're responsible for everything above the hypervisor."
                    }
                ]
            }
        ]
    }
};