import sys
outputStr = ""
poemStr = ""

with open("genText_NOT_OUTPUT.txt", 'r') as f:
    newln_cnt = 0
    for ln in f:
        if ln == "\n":
            newln_cnt += 1
        else:
            newln_cnt = 0
        poemStr += ln
        if newln_cnt >= 3:
            outputStr += poemStr
            poemStr = ""
            newln_cnt = 0

with open("genOutput.txt", 'w+') as f:
    f.write(outputStr)