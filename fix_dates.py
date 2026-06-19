import glob

for f in glob.glob('backend/app/routers/*.py'):
    with open(f, 'r', encoding='utf8') as file:
        text = file.read()
    
    if 'from datetime import' not in text:
        text = 'from datetime import datetime\n' + text
    
    text = text.replace("'fd': fd", "'fd': datetime.fromisoformat(fd)")
    text = text.replace('"fd": fd', '"fd": datetime.fromisoformat(fd)')
    
    text = text.replace("'td': td + ' 23:59:59'", "'td': datetime.fromisoformat(td + ' 23:59:59')")
    text = text.replace('"td": td + " 23:59:59"', '"td": datetime.fromisoformat(td + " 23:59:59")')
    
    with open(f, 'w', encoding='utf8') as file:
        file.write(text)
