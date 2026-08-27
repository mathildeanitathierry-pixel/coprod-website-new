eng=open('engine.js').read()
open('coprod-landing.html','w').write(open('shell.html').read().replace('<!--ENGINE-->', eng))
import os; print('built', round(os.path.getsize('coprod-landing.html')/1024/1024,2),'MB')
