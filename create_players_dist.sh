for i in `seq 1 10`
do
  node player_creator.js
  mkdir dist/$i
  mv level_*.json dist/$i
done