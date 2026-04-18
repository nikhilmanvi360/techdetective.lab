import re

file_path = r"c:\Users\Nikhil\Downloads\tech-detective_-the-digital-crime-lab\src\pages\AdminDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    r"cyber-green": "green-800",
    r"cyber-blue": "blue-900",
    r"cyber-amber": "yellow-800",
    r"cyber-red": "red-900",
    r"cyber-violet": "purple-900",
    r"cyber-line": "gray-400",
    r"cyber-bg": "gray-100",
    r"bg-[#fdfbf2]/80": "bg-[#fdfbf2]",
    r"text-\[\#a16207\]": "text-yellow-800",
    r"text-\[\#8b0000\]": "text-red-900"
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("AdminDashboard fully analog-ified!")
