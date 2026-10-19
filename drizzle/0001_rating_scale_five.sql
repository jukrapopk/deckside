-- Ratings move from a 1-10 scale to stars out of 5.
-- Existing values are rescaled; anything already within 0-5 is left alone.
UPDATE `games`
SET `rating` = CAST(ROUND(`rating` / 2.0) AS INTEGER)
WHERE `rating` > 5;
