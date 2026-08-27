eng=open("src/engine.js").read()
act=open("src/actuator.js").read()
open('index.html','w').write(open("src/shell.html").read().replace('<!--ENGINE-->', eng + '\n<script>\n' + act + '\n</script>'))
import os; print('built', round(os.path.getsize('index.html')/1024/1024,2),'MB')
