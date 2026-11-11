---
type: Document
title: Role of the Controls to Manage Energy State
description: An energy-centered approach clarifies the roles of the engine and flight controls beyond the simple “pitch for airspeed and power for altitude” by modeling how throttle and elevator inputs affect the airplane’s total mechanical energy.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf#page=3
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf
    title: 'Chapter 4: Energy Management: Mastering Altitude and Airspeed Control (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-4-energy-management-mastering-altitude-and-airspeed-control/role-of-the-controls-to-manage-energy-state
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=3
      note: p. 4-3
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=4
      note: p. 4-4
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=5
      note: p. 4-5
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=6
      note: p. 4-6
---
# Role of the Controls to Manage Energy State

From Chapter 4: Energy Management: Mastering Altitude and Airspeed Control, pages 4-3 to 4-6 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/05_afh_ch4.pdf#page=3>)).

An energy-centered approach clarifies the roles of the engine and flight controls beyond the simple “pitch for airspeed and power for altitude” by modeling how throttle and elevator inputs affect the airplane’s total mechanical energy. From an energy perspective, the problem of controlling vertical flight path and airspeed becomes one of handling the airplane’s energy state—the total amount of energy and its distribution over altitude and speed. Thus, rather than asking what controls altitude and what controls airspeed, a pilot can now ask what controls total energy and what controls its distribution over altitude and airspeed.

## Primary Energy Role of the Throttle and Elevator

The throttle, by increasing or decreasing engine thrust against drag, regulates changes in total mechanical energy. As illustrated above, changing total energy is a function of both thrust and drag (T – D). However, drag mainly varies long-term due to airspeed changes, or by using high lift/drag devices which can only increase drag. Therefore, changes in total energy are normally initiated by changing thrust, not drag. When the throttle setting makes thrust greater than drag, an increase of total mechanical energy is the result. When the throttle setting makes thrust less than drag, a decrease of total mechanical energy is the result. Once the desired path-speed profile is established, the throttle sets engine thrust to match the total energy demanded by vertical flight path and airspeed combined. The throttle then is the total energy controller.

On the other hand, the elevator is an energy exchanger and distribution device whose primary job is to allocate changes in total energy between vertical flight path and airspeed by adjusting pitch attitude. Here, once the chosen path-speed profile is achieved, the elevator sets the appropriate pitch attitude to maintain the demanded distribution of total energy over vertical flight path and airspeed. Thus, the elevator is the energy distribution controller.

The throttle and elevator then are really energy state controls—neither one controls altitude nor airspeed independently since these two variables are inherently coupled through the airplane’s total mechanical energy. Instead, to control altitude and airspeed effectively, the pilot coordinates the use of both devices to manage the airplane’s energy state.

The reservoir analogy \[Figure 4-3\] illustrates the energy-based role of the throttle and the elevator. In this analogy, the throttle controls the “valve” regulating the net total energy flow while the elevator controls the “valve” regulating the distribution of energy into and out of the altitude and airspeed “reservoirs.” Referring back to the energy balance equation \[Figure 4-2\], it becomes clear then that the throttle controls the left side of the equation (total energy) and the elevator controls the right side (energy distribution).

As illustrated in Figure 4-3, when the throttle increases thrust above drag (T – D \> 0) the airplane gains total energy, and when the throttle reduces thrust below drag (T – D \< 0) the airplane loses total energy. The elevator then distributes this increase or decrease in total energy between altitude and airspeed. Finally, when the throttle adjusts thrust equal to drag (T – D = 0), there is no change in total energy, but the energy stored as altitude and airspeed can be exchanged between the two reservoirs using the elevator, while total energy, at least short-term, remains constant.

*Figure 4-3. The reservoir analogy illustrating the primary role of the throttle and elevator to manage the airplane’s energy state.*

## Additional Role for the Elevator

On the front side of the power required curve, where the airplane cruises at high speed (1 in Figure 4-4) and a low angle of attack (AOA) with little or no excess power or excess thrust (A in Figure 4-4), pulling back on the yoke or stick (elevator up) will result in a brief energy exchange climb, causing the airplane to slow down from 1 to 2 toward the center of the power curve \[Figure 4-4\]. This decrease in airspeed results in a reduction in total drag; hence available energy in the form of positive excess power (PS \> 0) where thrust exceeds drag (T – D \> 0). With this excess power (B in Figure 4-4) the airplane can now climb at a constant airspeed or turn in level flight while maintaining a constant airspeed at an increased load factor.

On the backside of the power required curve, where the airplane flies at low speed (3 in Figure 4-4) and high AOA with little or no excess power or excess thrust (C in Figure 4-4), pushing forward on the yoke or stick (elevator down) will result in a brief energy exchange descent, causing the airplane to accelerate from 3 to 2 toward the center of the power curve \[Figure 4-4\]. This increase in airspeed results in a reduction in total drag; hence available energy in the form of positive excess power (PS \>0) where thrust exceeds drag (T – D \> 0). With this excess power (B in Figure 4-4) the airplane can now climb at a constant airspeed or turn in level flight while maintaining a constant airspeed at an increased load factor. This role of the elevator is critical to prevent unintentional, excessive deceleration or sink rate as illustrated later in the chapter (refer to Preventing Irreversible Deceleration and/or Sink Rate section).

*Figure 4-4. The front side and backside of the power required curve, the power available curve, and the relative excess power available (power available - power required) at different speeds.*

While the elevator can assist the throttle in changing T – D and PS through changes in airspeed via energy exchange as described above, occasionally the elevator can directly increase the “D” in T – D at any given speed during a level turn, thus helping the airplane rapidly bleed off total energy. As the airplane banks, load factor (lift/weight) increases because total lift has to increase to pull the airplane into the turn while simultaneously balancing its weight. This is accomplished by pulling back on the yoke (or stick) to increase AOA which results in increased induced drag and power required at any given speed. This action will quickly slow the airplane down and decrease total energy more rapidly than by just reducing the throttle setting to idle. This additional role of the elevator is shown on the power curve. \[Figure 4-5\]

*Figure 4-5. The effect of increased load factor on total drag and power required at different airspeeds.*

Applying the respective role of the controls to manage the airplane’s energy state leads to a set of simple “rules” for proper throttleelevator coordination to effectively control vertical flight path and airspeed. What are these basic rules of energy control?
