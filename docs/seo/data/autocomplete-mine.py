import json,urllib.parse,urllib.request,sys,concurrent.futures as cf,os
os.environ.setdefault('SSL_CERT_FILE','/root/.ccr/ca-bundle.crt')
seeds={
'en':['interior design companies','interior design firms','interior design studio','interior design company in','interior designers in','best interior design firms','top interior design companies','interior design firms in europe','interior design companies in germany','interior design firms in dubai','3d rendering company','3d rendering services','architectural rendering company','architectural visualization studio','real estate rendering','real estate 3d rendering','3d rendering for real estate','cgi company','property marketing cgi','virtual staging','3d floor plan','3d interior design','3d interior rendering','interior rendering services','hire interior designer','online interior design','interior design cost','interior designer cost','rendering studio','archviz studio','3d visualization company','3d visualization services','off plan','pre construction marketing','luxury interior design firms','hotel interior design firms','restaurant interior design','office interior design companies'],
'de':['innenarchitekt','innenarchitektur büro','interior design büro','innenarchitekt kosten','innenarchitekt berlin','innenarchitekt münchen','innenarchitekt hamburg','3d visualisierung','architekturvisualisierung','visualisierung immobilien','3d visualisierung immobilien','visualisierung bauträger','3d grundriss','virtual staging','innenraumvisualisierung','renderings','3d rendering','cgi immobilien','visualisierungsbüro','einrichtungsplanung','raumplanung online','interior designer'],
'es':['interiorismo','estudio de interiorismo','empresas de interiorismo','diseñador de interiores','diseño de interiores precio','interiorista precio','render 3d','renders 3d','infografía 3d','infografías 3d precio','render inmobiliario','renders para promotoras','visualización arquitectónica','estudio de arquitectura','home staging virtual','plano 3d','diseño de interiores online','reforma integral'],
'tr':['iç mimarlık firmaları','iç mimar','iç mimar fiyatları','iç mimarlık ofisi','iç tasarım','3d görselleştirme','mimari görselleştirme','3d render','render fiyatları','mimari render','iç mekan render','3d kat planı','sanal tur','gayrimenkul görselleştirme','dekorasyon firmaları','ev dekorasyonu'],
}
gl={'en':'us','de':'de','es':'es','tr':'tr'}
def g(q,l):
    u='https://suggestqueries.google.com/complete/search?client=firefox&hl=%s&gl=%s&q=%s'%(l,gl[l],urllib.parse.quote(q))
    try: return json.loads(urllib.request.urlopen(u,timeout=10).read().decode('utf-8','ignore'))[1]
    except Exception as e: return []
jobs=[]
for l,ss in seeds.items():
    for s in ss:
        for suf in ['',' ']+[' '+c for c in 'abcdefghiklmnoprstuvw']+['best ','top ','how much ','cost ' if l=='en' else '']:
            if not suf: q=s
            elif suf.endswith(' ') and not suf.startswith(' '): q=suf+s
            else: q=s+suf
            jobs.append((l,s,q))
out={}
with cf.ThreadPoolExecutor(16) as ex:
    for (l,s,q),r in zip(jobs,ex.map(lambda j:g(j[2],j[0]),jobs)):
        out.setdefault(f'{l}|{s}',set()).update(r)
json.dump({k:sorted(v) for k,v in out.items()},open('ac2.json','w'),ensure_ascii=False,indent=0)
print(len(jobs),'queries', sum(len(v) for v in out.values()),'suggestions')
