---
type: Document
title: Rules of Energy Control
description: 'The central principle encapsulating the role of the throttle and elevator for managing the airplane’s energy can be summed up as follows: coordinated throttle and elevator inputs control the airplane’s energy state.'
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf#page=6
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf
    title: 'Chapter 4: Energy Management: Mastering Altitude and Airspeed Control (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-4-energy-management-mastering-altitude-and-airspeed-control/rules-of-energy-control
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=6
      note: p. 4-6
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=7
      note: p. 4-7
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=8
      note: p. 4-8
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=9
      note: p. 4-9
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=10
      note: p. 4-10
---
# Rules of Energy Control

From Chapter 4: Energy Management: Mastering Altitude and Airspeed Control, pages 4-6 to 4-10 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf#page=6>)).

The central principle encapsulating the role of the throttle and elevator for managing the airplane’s energy can be summed up as follows: coordinated throttle and elevator inputs control the airplane’s energy state. Modifying a popular adage, the principle can be restated as “pitch plus power controls energy state.” This central principle serves to guide a set of general energy control rules to achieve and maintain any desired vertical flight path and airspeed targets within the airplane’s energy envelope.

## Visualizing the Airplane’s Ability to “Move” Between Energy States

To better understand the basic rules of energy control, a pilot needs to visualize an airplane’s energy state and its ability to switch from one energy state to another. In other words, how does an airplane “move” from an initial altitude and airspeed to any other target altitude and airspeed within its flight envelope, and how does the pilot control the process? A map should help, and in this case, it charts the status of the aircraft in terms of energy.

In a navigation map, such as an aeronautical sectional chart, the geographic position of an airplane is determined by two variables— latitude and longitude. Likewise, in an “altitude-airspeed” or “energy” map the energy position of an airplane, its energy state, is defined by two variables—altitude and airspeed. \[Figure 4-6\]

*Figure 4-6. The altitude-speed “map” showing lines of constant energy height.*

The position of an airplane in the altitude-airspeed map represents its total specific energy or ES (which is simply the sum of its potential and kinetic energies divided by aircraft weight) as determined by its current altitude and airspeed.

ES = h + V² 2g

Where,

g = gravitational constant h = height (altitude) V = velocity (airspeed)

Since the total specific energy, ES, has the units of height (e.g., feet), it is usually called energy height. It also gets this name from the fact that energy height is the maximum height that an airplane would reach from its current altitude, if it were to trade all its speed for altitude. Figure 4-6 shows lines of constant total specific energy or energy height. Different positions of an airplane along a given energy height line have the same total energy regardless of their location on the line (e.g., A and B).

Thus, even though the airplane in point A is cruising at 100 knots and 6,000 feet, it has the same total specific energy expressed in height (6,500 feet) when cruising at 240 knots and 4,000 feet (B). This also means that the airplane in either position, A or B, would be able to “zoom” to the same maximum altitude of 6,500 feet by trading all its speed for altitude. The lines of constant energy height can be used as idealized trajectories to depict an airplane moving from one energy state to another solely through energy exchange (e.g., A to B). If the airplane rapidly exchanges altitude and airspeed, it would follow along the energy height line while, in the short term, maintaining constant total energy.

In addition to showing energy height lines, the energy map can also depict available specific excess power (PS) contours, as well as energy trajectories of an airplane moving from one energy state to another. \[Figure 4-7\] The airplane can move along energy height lines by simply exchanging energy (e.g., A to B). However, to move across energy height lines, the airplane needs to increase or decrease total energy while distributing the energy change between altitude and airspeed. Thus, the ability of an airplane to go from one energy height to another (e.g., from A to positions C, D, or E) is a function of specific excess power (PS), measured in rate of change in distance or height (e.g., feet per minute).

Examine the energy positions depicted in Figure 4-7. The airplane in position A is flying at 4,000 feet and 150 knots with a total energy equivalent to 5,000 feet. Since positions C, D and E are located at higher energy heights (11,000, 9,500, and 6,500 feet respectively), the only way for the airplane to reach them from position A is by increasing its total energy (i.e., increasing thrust above drag, or PS \> 0). The reverse is also true. If the airplane is in position C, D or E, the only way for it to get back to position A is by decreasing its total energy (i.e., decreasing thrust below drag, or PS \< 0). In other words, the rate at which the airplane can move from one energy height to another—e.g., how swiftly it can climb/descend at a steady speed, or accelerate/decelerate in level flight—is a function of specific excess power, which can be positive (PS \> 0) or negative (PS \< 0) depending on whether the airplane needs to move to an energy height that demands more or less total energy.

At the edge of the energy envelope, where available PS = 0 at full throttle, the airplane can no longer climb while maintaining airspeed or accelerate without descending. Inside this envelope, inner contours increase in value, reaching a “peak” where available PS is maximized. Notice that PS at full throttle is maximized at a specific airspeed (VY) decreasing in value at slower or faster airspeeds. At VY then, the airplane can attain the maximum rate of climb while maintaining airspeed or the maximum acceleration without descending \[Figure 4-7\].

*Figure 4-7. Energy map depicting specific excess power (PS) contours (shown in feet per minute) and energy trajectories for a hypothetical airplane.*

## Three Basic Rules of Energy Control

An “energy-control” map can help visualize the basic energy control rules. \[Figure 4-8\] The energy-control map depicts not only the trajectories of an airplane transitioning from an arbitrary initial energy state (1) to other target states (2, 3, 4, 5, 6, and 7), but also the changes in energy caused by the throttle (blue/red arrows) and the elevator (green arrows). In other words, it allows pilots to visualize the basic control rules for moving an airplane from any state to another. The edge of the sustainable energy state envelope (where PS = 0 at full throttle) is also illustrated.

Note that the line of constant total energy (dashed line) that divides the area in the map requiring more total energy (blue area) from that which requires less energy (red area) is depicted relative to the arbitrary initial energy state (1). The throttle adds (blue arrow) or subtracts (red arrow) the amount of total energy demanded by the new target energy state, while the elevator (green arrows) distributes the correct amount of total energy between potential and kinetic energies. By balancing the simultaneous actions of the controls, the airplane can follow the desired energy trajectory.

As illustrated in Figure 4-8, moving the airplane from position 1 to the energy states in 2 and 3 calls for a higher throttle setting to increase total energy by the same amount (in this example, positions 2 and 3 are located at the same higher-energy height). The difference between these two energy trajectories (1-to-2 and 1-to-3) lies in the way the total energy change is distributed by the elevator through changes in pitch attitude. As can be seen in Figure 4-8, changes in total energy by adjusting throttle setting (blue/red arrows) extend across lines of constant total energy (dashed line), while changes in energy distribution by adjusting the elevator deflection (green arrows) extend along the lines of constant total energy (equal energy height). Appropriate changes in total energy via the throttle and/or changes in energy distribution via the elevator, depicted by their respective energy “arrows,” determine the direction of a given energy trajectory between two energy states. To visualize this effect, compare the trajectory from 1-to-2 with that from 1-to-3 and notice the way the corresponding elevator energy arrows (left green arrow = up-elevator; right green arrow = down-elevator) are positioned in relation to the throttle energy arrow (blue arrow = increased throttle).

*Figure 4-8. The energy-control map helping to visualize the basic energy control rules.*

Thus, transitioning to a higher altitude at a constant speed (1-to-2) requires increased throttle and up-elevator to stay on speed, while transitioning to a faster airspeed at a constant altitude (1-to-3) demands increased throttle and (gradual) down-elevator to stay on path, re-trimming as needed to relieve elevator control pressures.

Transitioning to a lower altitude at a constant speed (1-to-4) requires decreased throttle and down-elevator to stay on speed, while transitioning to a slower airspeed at a constant altitude (1-to-5) demands decreased throttle and (gradual) up-elevator to stay on path, re-trimming as needed to relieve elevator control pressures.

Finally, transitioning to a higher altitude by trading speed for altitude (1-to-6) requires up-elevator without initially changing throttle setting, while transitioning to a faster airspeed by trading altitude for speed (1-to-7) requires down-elevator without initially changing throttle setting. In both cases, at the end of the energy exchange maneuver, the elevator will need to be re-trimmed and throttle setting adjusted to match drag at the new speed in order to maintain total energy constant while remaining at the new altitude-airspeed target.

As can be visualized in Figure 4-8, there are three general energy control rules for coordinating the throttle and elevator to move the airplane from one energy state to another:

Rule #1: If you want to move to a new energy state that demands more total energy, then: Throttle: increase throttle setting so that thrust is greater than drag, thus increasing total energy;

Elevator: adjust pitch attitude as appropriate to distribute the total energy being gained over altitude and airspeed:

a. To climb at constant speed, pitch up just enough to maintain the desired speed; b. To accelerate at constant altitude, gradually pitch down just enough to maintain path.

Upon reaching new desired energy state, adjust pitch attitude and throttle setting as needed to maintain the new path-speed profile.

Rule #2: If you want to move to a new energy state that demands less total energy, then:

Throttle: reduce throttle setting so that thrust is less than drag, thus decreasing total energy;

Elevator: adjust pitch attitude as appropriate to distribute the total energy being lost over altitude and airspeed:

a. To descend at constant speed, pitch down just enough to maintain the desired speed; b. To slow down at constant altitude, gradually pitch up just enough to maintain path.

Upon reaching new desired energy state, adjust pitch attitude and throttle setting as needed to maintain the new path-speed profile.

Rule #3: If you want to move to a new energy state that demands no change in total energy, then:

Throttle: do not change initially, but adjust to match drag at the end of maneuver as needed to maintain total energy constant;

Elevator: adjust pitch attitude to exchange energy between altitude and airspeed:

a. To trade speed for altitude, pitch up; b. To trade altitude for speed, pitch down.

Upon reaching new desired energy state, adjust pitch attitude and throttle setting as needed to maintain the new path-speed profile.

Note that control rules 1 and 2 allow the elevator to distribute the change in total energy in different ways. For example, using rule

1. a the pilot may choose to adjust the pitch-up attitude to climb at a slower (or faster) airspeed. Other situations may require combining two control rules. One example is when, at maximum cruise airspeed in level flight, thrust has reached its maximum limit (i.e., PS = 0) but the target energy state is at a higher altitude and total energy within the airplane’s envelope. At maximum level airspeed, there is no excess thrust available to increase the airplane’s total energy needed to climb. One solution is to initially trade kinetic for potential energy (rule 3.a), slowing down to an airspeed where drag is reduced below thrust, thus allowing the airplane to increase its total energy and climb at that slower airspeed (rule 1.a).
