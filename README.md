vPlayer for NES Tetris
----------------------

A virtual Nintendo NES Tetris (NTSC) player to compete with.

Usage
=====

* To load profile (vJonas and vHarry are very work-in-progress), drop a JSON file to the screen. Alternatively, add `?profile=<URL for json>` to URL (Be careful for CORS).
* To start, press Enter key
* To skip to death, press S key
* To reset, press R key

How parameters works
====================

Parameters are written in JSON file. Examples are attached (vJonas and vHarry). Parameter adjustments of them are hugely welcomed!

The player has three states: Safe, Danger, Death. Diagram of state transitions and their probabilities (trials are *performed every second*) are following:

```
           <--- danger_to_safe ----
   Safe                                Danger    ---- (1 - danger_to_safe) * danger_to_death --->    Death
           ---- safe_to_danger --->
```

The probabilities are arrays of three elements: lvl 18, lvl 19, lvl 29 (killscreen) respectively.

`lines_***` represents probabilities for number of lines erasing at once, in each level and state.
For example, `[0.4, 0.2, 0.15, 0.25]` means 40% single, 20% double, 0.15% triple, 0.25% tetris.
The total must be 1.0.

`use_drop` affects stacking speed in level 18. It is usually 0 (do not use down button, slow) or 1 (use down button, fast), but you can use intermediate values.

For testing profiles, append `?debug=true` to URL and press Enter. This will run 10 instances immediately and data of lines/score for every 30 seconds are output in developer tools console. The output can be used in R script as it is.

TODO
====

* Points increase by pressing down
* ~~Use a frontend framework. Hyperapp would be great (because the name is like Hypertap!)~~ **Now with ~~Hypertap~~Hyperapp!**
