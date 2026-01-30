-- Create sequence for personal file numbers (race-condition safe)
CREATE SEQUENCE IF NOT EXISTS personal_file_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;