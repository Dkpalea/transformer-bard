print('Importing libraries...')

import numpy as np
import os
from os.path import join
import tensorflow as tf

from tensor2tensor import models
from tensor2tensor import problems
from tensor2tensor.data_generators import text_encoder
from tensor2tensor.utils import decoding
from tensor2tensor.utils import trainer_lib

import magenta.music as mm
from magenta.models.score2perf import score2perf

print('Done!')

def music_generator(primer='erik_gnossienne', primer_begin_buffer=10, primer_length=90, output_path='.', filename='./public/output'):
  SF2_PATH = './models/Yamaha-C5-Salamander-JNv5.1.sf2'
  SAMPLE_RATE = 16000

  # Upload a MIDI file and convert to NoteSequence.
  def upload_midi():
    data = list(files.upload().values())
    if len(data) > 1:
      print('Multiple files uploaded; using only one.')
    return mm.midi_to_note_sequence(data[0])

  # Decode a list of IDs.
  def decode(ids, encoder):
    ids = list(ids)
    if text_encoder.EOS_ID in ids:
      ids = ids[:ids.index(text_encoder.EOS_ID)]
    return encoder.decode(ids)

  model_name = 'transformer'
  hparams_set = 'transformer_tpu'
  ckpt_path = './models/checkpoints/unconditional_model_16.ckpt'

  class PianoPerformanceLanguageModelProblem(score2perf.Score2PerfProblem):
    @property
    def add_eos_symbol(self):
      return True

  problem = PianoPerformanceLanguageModelProblem()
  unconditional_encoders = problem.get_feature_encoders()

  # Set up HParams.
  hparams = trainer_lib.create_hparams(hparams_set=hparams_set)
  trainer_lib.add_problem_hparams(hparams, problem)
  hparams.num_hidden_layers = 16
  hparams.sampling_method = 'random'

  # Set up decoding HParams.
  decode_hparams = decoding.decode_hparams()
  decode_hparams.alpha = 0.0
  decode_hparams.beam_size = 1

  # Create Estimator.
  run_config = trainer_lib.create_run_config(hparams)
  estimator = trainer_lib.create_estimator(
      model_name, hparams, run_config,
      decode_hparams=decode_hparams)

# These values will be changed by subsequent cells.
  targets = []
  decode_length = 0

  # Create input generator (so we can adjust priming and
  # decode length on the fly).
  def input_generator():
    global targets
    global decode_length
    while True:
      yield {
          'targets': np.array([targets], dtype=np.int32),
          'decode_length': np.array(decode_length, dtype=np.int32)
      }

  # Start the Estimator, loading from the specified checkpoint.
  input_fn = decoding.make_input_fn_from_generator(input_generator())
  unconditional_samples = estimator.predict(
      input_fn, checkpoint_path=ckpt_path)

  # "Burn" one.
  _ = next(unconditional_samples)
    



  filenames = {
      'C major arpeggio': './models/primers/c_major_arpeggio.mid',
      'C major scale': './models/primers/c_major_scale.mid',
      'Clair de Lune': './models/primers/clair_de_lune.mid',
      'Classical': 'audio_midi/Classical_Piano_piano-midi.de_MIDIRip/bach/bach_846_format0.mid',
      'erik_gymnopedie': 'audio_midi/erik_satie/gymnopedie_1_(c)oguri.mid',
      'erik_gymnopedie_2': 'audio_midi/erik_satie/gymnopedie_2_(c)oguri.mid',
      'erik_gymnopedie_3': 'audio_midi/erik_satie/gymnopedie_3_(c)oguri.mid',
      'erik_gnossienne': 'audio_midi/erik_satie/gnossienne_1_(c)oguri.mid',
      'erik_gnossienne_2': 'audio_midi/erik_satie/gnossienne_2_(c)oguri.mid',
      'erik_gnossienne_3': 'audio_midi/erik_satie/gnossienne_3_(c)oguri.mid',
      'erik_gnossienne_dery': 'audio_midi/erik_satie/gnossienne_1_(c)dery.mid',
      'erik_gnossienne_dery_2': 'audio_midi/erik_satie/gnossienne_2_(c)dery.mid',
      'erik_gnossienne_dery_3': 'audio_midi/erik_satie/gnossienne_3_(c)dery.mid',
      'erik_gnossienne_dery_5': 'audio_midi/erik_satie/gnossienne_5_(c)dery.mid',
      'erik_gnossienne_dery_6': 'audio_midi/erik_satie/gnossienne_6_(c)dery.mid',
      '1': 'audio_midi/erik_satie/1.mid',
      '2': 'audio_midi/erik_satie/2.mid',
      '3': 'audio_midi/erik_satie/3.mid',
      '4': 'audio_midi/erik_satie/4.mid',
      '5': 'audio_midi/erik_satie/5.mid',
      '6': 'audio_midi/erik_satie/6.mid',
      '7': 'audio_midi/erik_satie/7.mid',
      '8': 'audio_midi/erik_satie/8.mid',
      '9': 'audio_midi/erik_satie/9.mid',
      '10': 'audio_midi/erik_satie/10.mid',
  }
  # primer = 'C major scale' 

  #if primer == 'Upload your own!':
  #  primer_ns = upload_midi()
  #else:
  #  # Use one of the provided primers.
  #  primer_ns = mm.midi_file_to_note_sequence(filenames[primer])
  primer_ns = mm.midi_file_to_note_sequence(filenames[primer])
  # Handle sustain pedal in the primer.
  primer_ns = mm.apply_sustain_control_changes(primer_ns)

  # Trim to desired number of seconds.
  max_primer_seconds = primer_length
  if primer_ns.total_time > max_primer_seconds:
    print('Primer is longer than %d seconds, truncating.' % max_primer_seconds)
    primer_ns = mm.extract_subsequence(
        primer_ns, primer_begin_buffer, max_primer_seconds+primer_begin_buffer)

  # Remove drums from primer if present.
  if any(note.is_drum for note in primer_ns.notes):
    print('Primer contains drums; they will be removed.')
    notes = [note for note in primer_ns.notes if not note.is_drum]
    del primer_ns.notes[:]
    primer_ns.notes.extend(notes)

  # Set primer instrument and program.
  for note in primer_ns.notes:
    note.instrument = 1
    note.program = 0

  ## Play and plot the primer.
  #mm.play_sequence(
  #    primer_ns,
  #    synth=mm.fluidsynth, sample_rate=SAMPLE_RATE, sf2_path=SF2_PATH)
  #mm.plot_sequence(primer_ns)
  mm.sequence_proto_to_midi_file(
    primer_ns, join(output_path, 'primer_{}.mid'.format(filename)))


  targets = unconditional_encoders['targets'].encode_note_sequence(
      primer_ns)

  # Remove the end token from the encoded primer.
  targets = targets[:-1]

  decode_length = max(0, 10000 - len(targets))
  if len(targets) >= 4096:
    print('Primer has more events than maximum sequence length; nothing will be generated.')

  # Generate sample events.
  sample_ids = next(unconditional_samples)['outputs']

  # Decode to NoteSequence.
  midi_filename = decode(
      sample_ids,
      encoder=unconditional_encoders['targets'])
  ns = mm.midi_file_to_note_sequence(midi_filename)
  print('Sample IDs: {}'.format(sample_ids))
  print('Sample IDs length: {}'.format(len(sample_ids)))
  print('Encoder: {}'.format(unconditional_encoders['targets']))
  print('Unconditional Samples: {}'.format(unconditional_samples))
  # print('{}'.format(ns))

  # continuation_ns = mm.concatenate_sequences([primer_ns, ns])
  continuation_ns = ns
  # mm.play_sequence(
  #     continuation_ns,
  #     synth=mm.fluidsynth, sample_rate=SAMPLE_RATE, sf2_path=SF2_PATH)
  # mm.plot_sequence(continuation_ns)
  # try:
  audio = mm.fluidsynth(continuation_ns, sample_rate=SAMPLE_RATE, sf2_path=SF2_PATH)

  normalizer = float(np.iinfo(np.int16).max)
  array_of_ints = np.array(
      np.asarray(audio) * normalizer, dtype=np.int16)

  wavfile.write(join(output_path, filename + '.wav'), SAMPLE_RATE, array_of_ints)
  print('[+] Output stored as {}'.format(filename+'.wav'))
  mm.sequence_proto_to_midi_file(
      continuation_ns, join(output_path, 'continuation_{}.mid'.format(filename)))
  # except:
    # print('[-] Generated Piece is empty. Try generating again!')
	
	
if __name__ == '__main__':
  music_generator()
