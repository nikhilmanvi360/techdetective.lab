🕵️ Tech Detective: Official Campaign Walkthrough
This guide provides the solutions and logic for every terminal puzzle and interrogation in the Round 2 Detective Campaign. Use this to assist students who get stuck on syntax or logic.

🍽️ Zone 1: Cafeteria & Kitchen
1. The Left-Behind Laptop (Terminal)
Clue Required: Find the HR Printout (Item) on a table. It reveals the suspect's name is Raza Malik and birth year is 1998.
Solution: login --pass Raza1998
Logic: Combining the first name and birth year as the password.
2. The Kitchen Terminal (Clue)
Task: Access the terminal inside the locked kitchen.
Result: Logs show sys_ghost was active at 11:05 PM. This clue is added to your notebook.
3. The Student Witness (Interrogation)
The Lie: The witness says "No one was in the kitchen after 11:00 PM."
Evidence to Present: Terminal log: sys_ghost active at 11:05 PM.
Result: The witness admits the truth and gives you Key A.
📚 Zone 2: Campus Library
1. The Redacted Document (Terminal)
Clue Required: Inspect the desk nearby to see a CSS snippet: .redacted { display: none; }.
Solution: set display block
Logic: Changing the CSS property none to block reveals the hidden text. This gives the clue about the Librarian authorizing access.
2. The Python Snippet (Clue)
Clue: A note on the floor reads: for i in range(1, 5): if i == 3: break.
Logic: The loop stops at index 3. Go to the tile for Bookcase 3 to find Key B.
3. The Librarian (Interrogation)
The Lie: The Librarian claims her logs are clean and she doesn't know the suspect.
Evidence to Present: Decrypted Doc: Librarian authorized sys_ghost access.
Result: She confesses and lets you pass to Maintenance.
🛠️ Zone 3: Maintenance Wing
1. Node Alpha (Python Repair)
Clue Required: Talk to the Caretaker. He mentions a IndexError on Node Alpha. Inspect the Whiteboard to see a list of 4 systems.
Solution: fix_index 3
Logic: Python lists are 0-indexed. A list of 4 items has indices 0, 1, 2, 3. Index 4 is out of range. 3 is the highest valid index (Grid_Control).
2. Node Beta & Node Gamma (Syncing)
Clue Required: Inspect the Whiteboard. It shows nodes = ['Gamma', 'Alpha', 'Beta']; nodes.sort();.
Solution:
sync node_beta (only after Node Alpha is fixed)
sync node_gamma (only after Node Beta is fixed)
Logic: Python's .sort() puts them in alphabetical order: Alpha -> Beta -> Gamma.
🔒 Zone 4: Admin Core
1. The Firewall Terminal
Clue Required: You need to remember values from the Cafeteria and Library.
Solution: bypass -a "11:05 PM" -b "display block"
-a: The login time found in the Kitchen.
-b: The CSS property used in the Library.
2. The Security Director (Final Interrogation)
The Challenge: He needs full proof of the identity, timeline, and authorization.
Evidence Sequence (Present these three clues):
Raza Malik was born in 1998.
Terminal log: sys_ghost active at 11:05 PM.
Decrypted Doc: Librarian authorized sys_ghost access.
3. The Core Terminal (Final Shutdown)
Clue Required: Inspect the Admin Desks to find the flags for force (-f) and user (-u).
Solution: initiate_shutdown -f -u sys_ghost
Logic: Executing the final system command to stop the protocol and win the game.
