---
type: Document
title: Jet Airplane Descent and Approach
description: The smoothest and most fuel-efficient descent would be to reduce power to flight idle and slow to L/DMAX.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf#page=17
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf
    title: 'Chapter 16: Transition to Jet-Powered Airplanes (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-16-transition-to-jet-powered-airplanes/jet-airplane-descent-and-approach
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=17
      note: p. 16-17
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=18
      note: p. 16-18
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=19
      note: p. 16-19
---
# Jet Airplane Descent and Approach

From Chapter 16: Transition to Jet-Powered Airplanes, pages 16-17 to 16-19 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/17_afh_ch16.pdf#page=17>)).

The smoothest and most fuel-efficient descent would be to reduce power to flight idle and slow to L/DMAX. In this scenario, the pilot would descend, level off to decelerate, configure for landing, intercept the final approach, and continue a gradual deceleration until setting power for a stabilized descent on final. Traffic and time considerations almost always require deviation from this example, and the typical descent profile has three descent segments with two speed reductions in between.

## Descent Planning

For a typical idle power descent, the top of descent (TOD), point A in figure 16-14, is determined by altitude, adjusted for wind. Jet descent profiles normally approximate a 3 degree path, with some time/distance required for deceleration in level flight. While exact distances will vary, having a descent plan will put the pilot well ahead of the jet and in a better position to monitor the automation.

*Figure 16-14. Typical descent profile.*

For a straight-in VFR approach to an airport without factoring wind, an estimate for TOD may be calculated by multiplying the planned descent (in thousands of feet) by 3 and adding any distance needed for speed reductions in level flight (losing about 10 KIAS per mile when level). If flying at 35,000 feet above airport elevation, a cruise descent would start approximately 120 miles from the airport (35 times 3, plus about 15 miles for speed reduction, in stages, from cruise speed in this example). \[Figure 16-14\] Normally, cruise Mach is maintained until increasing air density causes indicated airspeed to increase to the desired descent speed, which usually occurs just below 30,000 feet. If arriving at point B at 10,000 feet MSL about 40 miles from the airport for deceleration to 250 knots, the pilot would resume a descent about 35 miles from the airport, continuing to 1,500 feet about 15 miles from the runway. The approach would continue with deceleration and flap extension so as to start the final descent 5 miles from the runway. There, the pilot extends the landing gear and selects landing flaps by 1,000 feet AGL, and brings the power up by 500 feet AGL to maintain the appropriate speed for a stabilized approach.

Variables that affect the TOD calculation include:

- Head/tail wind component (adjust distance 1 mile for each 10 knots of wind at cruise altitude),
- Field elevation,
- Terrain considerations,
- Runway alignment on arrival,
- ATC vectors and speed restrictions,
- Type of approach.

## Descent Energy Management

While descending, the pilot can check the progress periodically. Estimating using round numbers keeps the calculation simple. Passing 25,000 feet should occur at 75 miles out plus or minus corrections; 20,000 feet should be at 60 miles, etc. If there is a deviation from the desired altitude/distance target, the energy state needs to be adjusted.

As discussed in Chapter 4, Using Energy Management to Master Altitude and Airspeed Control, there are two forms of energy in an airplane: potential energy in the form of altitude, and kinetic energy in the form of speed. In the normal operating regime at speeds above L/DMAX, increasing speed increases total drag, while a decreasing speed will decrease total drag.

At idle power and at speeds above L/DMAX, increasing speed increases the rate of descent. Sample data for a particular make and model might look like the following:

- 210 KIAS = 1,000 feet per minute
- 250 KIAS = 1,500 feet per minute
- 300 KIAS = 3,000 feet per minute

The exponential increase in parasite drag at higher speeds has a significant impact on both the rate of descent and the descent angle. Using the sample numbers, a 20% increase in airspeed from 210 to 250 knots, results in a 50% increase in the descent rate. However, a 20% increase in airspeed from 250 to 300 knots results in a 100% increase in the descent rate. Therefore, when at a higher altitude than desired in a descent, lowering the nose to increase speed will increase the descent angle and get the aircraft back to the desired path. Conversely, if lower than planned in descent, raising the nose to decrease speed will reduce descent angle until back on the desired path. Often, just a 10-knot change in speed allows for a smooth and gradual correction.

If speed adjustment is not an option, power can be added to correct a low-energy state, or the speed brakes used to correct a highenergy state. Numerous power fluctuations or repeated deployment and stowing of speed brakes is an indication of either pilot failure to adequately plan and/or manage the descent, or a poorly designed arrival procedure.

If a different descent speed from that planned is used during a descent, an adjustment should be made to the top of descent point. If ahead of schedule, leaving cruise altitude sooner, setting flight idle, and descending at a slower speed will burn less fuel. Conversely, if running late and willing to burn some extra fuel, the pilot can leave cruise later and descend at a higher speed. In all cases, the pilot should check progress during the descent and continue to adjust as necessary.

Planned descent speed will affect the position of the planned top of descent point. \[Figure 16-15\] In this example, both jets fly past point X at the same cruise speed and altitude with plans to arrive at point Y at 10,000 feet and 250 knots. In both cases, the aircraft would then be in a position to set up a continued descent. The 250-knot descent requires a few miles for deceleration and gives a shallower descent path. The 300-knot descent allows staying at altitude longer, descending at a steeper angle, and then leveling off to slow to 250 knots. The jet that descended at 300 knots arrives first at point Y but burns more fuel. While not depicted, an inefficient descent plan would start the descent at point X, maintain 300 knots, and require power to maintain that airspeed on a shallow descent path.

*Figure 16-15. Effect of speed on descent path.*

Descending prior to the planned TOD point will increase time to destination and fuel consumption. When given a descent clearance prior to the planned TOD, it is acceptable to ask ATC if the descent can be done at the pilot’s discretion. If authorized to do so, this option allows for maintaining speed and altitude until reaching the calculated top of descent point. If an immediate descent is required, a descent at 1,000 feet per minute is usually acceptable until reaching the desired path. If a descent clearance has not been received by the planned TOD point, a speed reduction will reduce the airplane's kinetic and total energy while potential energy remains constant. When the clearance is received, a slightly steeper descent at the onset allows for a desired increase in kinetic energy at the expense of altitude and an appropriate descent rate such that the airplane follows the steeper desired path with acceptable energy distribution.
