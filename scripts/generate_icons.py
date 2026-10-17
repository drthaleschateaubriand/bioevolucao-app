#!/usr/bin/env python3
"""Generate PWA PNG assets using Python's standard library."""
import os, struct, zlib
def inside(x,y,l,t,r,b,q):
    if x < l or x >= r or y < t or y >= b: return False
    cx=min(max(x,l+q),r-q);cy=min(max(y,t+q),b-q)
    return (x-cx)**2+(y-cy)**2<=q*q
def ell(x,y,cx,cy,rx,ry):
    return ((x-cx)/rx)**2+((y-cy)/ry)**2<=1
def draw(size):
    rows=[]
    for j in range(size):
        v=(j+.5)*512/size;row=bytearray([0])
        for i in range(size):
            u=(i+.5)*512/size
            rgba=(0,0,0,0)
            if inside(u,v,0,0,512,512,110): rgba=(23,34,54,255)
            if inside(u,v,68,68,444,444,93): rgba=(28,174,153,255)
            if (160<=u<=222 and 134<=v<=379) or ell(u,v,237,204,90,75) or ell(u,v,238,311,92,72):
                rgba=(255,255,255,255)
            if (ell(u,v,247,204,42,30) or ell(u,v,251,311,41,27)) and u>210: rgba=(28,174,153,255)
            row.extend(rgba)
        rows.append(bytes(row))
    def chunk(kind,data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    raw=b''.join(rows)
    out=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    with open('icon-%d.png'%size,'wb') as f:f.write(out)
for side in (180,192,512): draw(side)
