import sys
import gpt_2_simple as gpt2

if len(sys.argv) <= 1:
    exit("Need prompt")

prompt = sys.argv[1]

sess = gpt2.start_tf_sess()
gpt2.load_gpt2(sess)

gpt2.generate_to_file(sess,
                            run_name='run1',
                            length=540,
                            temperature=0.9,
                            nsamples=1,
                            prefix=prompt,
                            destination_path="genText_NOT_OUTPUT.txt")
