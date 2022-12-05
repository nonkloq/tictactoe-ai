
















def diags(b):
    return [[b[0][0],b[1][1],b[2][2]],[b[0][2],b[1][1],b[2][0]]]

def rc(bo):
    r = []
    c = []
    for i in range(3):
        a = []
        b = []
        for j in range(3):
            a.append(bo[i][j])
            b.append(bo[j][i])
        r.append(a)
        c.append(b)
    return (r,c)

N = 5
board = [i for i in range(N*N)]
p=0
ro = []
co = []
dia = []
kl=0
c = []
for i in range(N,N*N+1,N):
    b = board[p:i]
    p =i
    c.append(b)
    if len(c)==3:
        x = 0
        y = 1
        z = 2
        while x<y<z<N:
            nb = []
            kl+=1
            for k in c:
                nb.append([k[x],k[y],k[z]])
            x+=1
            y+=1
            z+=1
            pos,pis = rc(nb)
            d = diags(nb)
            ro+=  pos
            co+=pis
            dia+=d
        c.pop(0)
print(ro)
print()
print(co)
print()
print(dia)
print(kl)


