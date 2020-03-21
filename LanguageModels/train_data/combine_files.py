import os

training_file = open("poem_training.txt", mode='w+', encoding="UTF-8")

for filename in os.listdir(os.getcwd()):
    if filename.endswith(".txt") and not filename == "poem_training.txt":
        with open(filename, "r") as f:
            for ln in f:
                training_file.write(ln)
        
training_file.close()