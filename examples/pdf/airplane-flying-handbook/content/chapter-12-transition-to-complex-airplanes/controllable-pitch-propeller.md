---
type: Document
title: Controllable-Pitch Propeller
description: Fixed-pitch propellers are designed for best efficiency at one particular revolutions per minute (rpm) setting and one airspeed. A fixed-pitch propeller provides suitable performance in a narrow range of airspeeds.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf#page=5
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf
    title: 'Chapter 12: Transition to Complex Airplanes (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-12-transition-to-complex-airplanes/controllable-pitch-propeller
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=5
      note: p. 12-5
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=6
      note: p. 12-6
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=7
      note: p. 12-7
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=8
      note: p. 12-8
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=9
      note: p. 12-9
---
# Controllable-Pitch Propeller

From Chapter 12: Transition to Complex Airplanes, pages 12-5 to 12-9 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf#page=5>)).

Fixed-pitch propellers are designed for best efficiency at one particular revolutions per minute (rpm) setting and one airspeed. A fixed-pitch propeller provides suitable performance in a narrow range of airspeeds. However, fixed-pitch efficiency suffers considerably when operating outside of this range. To provide improved propeller efficiency through a wide range of operation, the propeller blade angle needs to be controllable.

## Constant-Speed Propeller

A constant-speed propeller keeps the blade angle adjusted for maximum efficiency during most flight conditions. The pilot controls the engine rpm indirectly by means of a propeller control, which is connected to the propeller governor. For maximum takeoff power, the propeller control is moved all the way forward to the low pitch/high rpm position, and the throttle is moved forward to the maximum allowable manifold pressure position. \[Figure 12- 6\] To reduce power for climb or cruise, the pilot reduces manifold pressure to the desired value with the throttle, and then reduces engine rpm by moving the propeller control back toward the high pitch/low rpm position. The pilot sets the rpm accurately using the tachometer.

*Figure 12-6. Controllable-pitch propeller pitch angles.*

When an airplane engine runs at a constant governed speed, the torque (force) exerted by the engine at the propeller shaft equals the force resisting the moving blades. The pilot uses the propeller control to change engine rpm by adjusting the propeller blade pitch, which increases or decreases the air resistance on the rotating propeller. For example, pulling back on the propeller control moves the propeller blades to a higher pitch. This increases the air resistance exerted on the spinning propeller and puts an additional load on the engine, which causes it to slow down until the forces reach equilibrium. Advancing the propeller control reduces the propeller blade pitch. This reduces the resistance of the air against the propeller. In response, the engine rpm increases until the opposing forces balance. In order for this system to function, a constant-speed propeller governor needs the means to sense engine rpm and a means to control the propeller AOA. In most cases, the governor is geared to the engine crankshaft giving it a means to sense engine rpm. The "Blade Angle Control" section of this chapter discusses the ways a propeller governor adjusts propeller blade angle.

Other factors affect constant-speed propeller blade pitch. When an airplane is nosed up into a climb from level flight, the engine tends to slow down. Since the governor is sensitive to small changes in engine rpm, it decreases the blade angle just enough to keep the engine speed constant. If the airplane is nosed down into a dive, the governor increases the blade angle just enough to keep the engine speed constant. This allows the engine to maintain a constant rpm and power output. The pilot can also set engine power output by changing rpm at a constant manifold pressure; by changing the manifold pressure at a constant rpm; or by changing both rpm and manifold pressure. The constant-speed propeller makes it possible to obtain an infinite number of power settings.

## Takeoff, Climb, and Cruise

During takeoff, when the forward motion of the airplane is at a low speed and when maximum power and thrust are required, the constant-speed propeller sets up a low propeller blade pitch. The low blade angle keeps the blade angle of attack, with respect to the relative wind, small and efficient at the low speed. \[Figure 12-7\]

At the same time, low blade pitch allows the propeller to handle a smaller mass of air per revolution. This light propeller load allows the engine to turn at maximum rpm and develop maximum engine power. Although the mass of air per revolution is small, the number of rpm is high, and propeller thrust is maximized until brake release. Thrust is maximum at the beginning of the takeoff roll and then decreases as the airplane gains speed.

*Figure 12-7. Propeller blade angle.*

As the airspeed increases after lift-off, the load on the engine is lightened because of the small blade angle. The governor senses this and increases the blade angle slightly. Again, the higher blade angle, with the higher speed, keeps the blade AOA with respect to the relative wind small and efficient.

For climb after takeoff, the power output of the engine is reduced to climb power by decreasing the manifold pressure and increasing the blade angle to lower engine rpm. At the higher (climb) airspeed and the higher blade angle, the propeller is handling a greater mass of air per second at a lower slipstream velocity. This reduction in power is offset by the increase in propeller efficiency. The blade AOA is again kept small by the increase in the blade angle with an increase in airspeed.

At cruising altitude, when the airplane is in level flight, airspeed increases, and less power is required. Consequently, the pilot uses the throttle to reduce manifold pressure and uses the propeller control to reduce engine rpm. The higher airspeed and higher blade angle enable the propeller to handle a still greater mass of air per second at still smaller slipstream velocity. At normal cruising speeds, propeller efficiency is at or near maximum efficiency.

## Blade Angle Control

Once the rpm settings for the propeller are selected, the propeller governor automatically adjusts the blade angle to maintain the selected rpm. It does this by using oil pressure. Generally, the oil pressure used for pitch change comes directly from the engine lubricating system. When a governor is employed, engine oil is used and the oil pressure is usually boosted by a pump that is integrated with the governor. The higher pressure provides a quicker blade angle change. The rpm at which the propeller is to operate is adjusted in the governor head. The pilot changes this setting by changing the position of the governor rack through the flight deck propeller control.

On some constant-speed propellers, changes in pitch are obtained by the use of an inherent centrifugal twisting moment of the blades that tends to flatten the blades toward low pitch and oil pressure applied to a hydraulic piston connected to the propeller blades which moves them toward high pitch. Another type of constant-speed propeller uses counterweights attached to the blade shanks in the hub. Governor oil pressure and the blade twisting moment move the blades toward the low pitch position, and centrifugal force acting on the counterweights moves them (and the blades) toward the high pitch position. In the first case above, governor oil pressure moves the blades towards high pitch and in the second case, governor oil pressure and the blade twisting moment move the blades toward low pitch. A loss of governor oil pressure, therefore, affects each differently.

## Governing Range

The blade angle range for constant-speed propellers varies from about 11.5° to 40°. The higher the speed of the airplane, the greater the blade angle range. \[Figure 12-8\]

*Figure 12-8. Blade angle range (values are approximate).*

The range of possible blade angles between high and low blade angle pitch stops define the propeller’s governing range. As long as the propeller's blades operate within the governing range and not against either pitch stop, a constant engine rpm is maintained. However, once the propeller blades reach their pitch-stop limit, the engine rpm increases or decreases with changes in airspeed and propeller load similar to a fixed-pitch propeller. For example, once a specific rpm is selected, if the airspeed decreases enough, the propeller blades reduce pitch in an attempt to maintain the selected rpm until they contact their low pitch stops. From that point, any further reduction in airspeed causes the engine rpm to decrease. Conversely, if the airspeed increases, the pitch angle of the propeller blades increase until the high pitch stop is reached. The engine rpm then begins to increase.

## Constant-Speed Propeller Operation

The engine is started with the propeller control in the low pitch/high rpm position. This position reduces the load or drag of the propeller and the result is easier starting and warm-up of the engine. During warm-up, the propeller blade changing mechanism is operated slowly and smoothly through a full cycle. This is done by moving the propeller control (with the manifold pressure set to produce about 1,600 rpm) to the high pitch/low rpm position, allowing the rpm to stabilize, and then moving the propeller control back to the low pitch takeoff position. This is done for two reasons: to determine whether the system is operating correctly and to circulate fresh warm oil through the propeller governor system. Remember the oil has been trapped in the propeller cylinder since the last time the engine was shut down. There is a certain amount of leakage from the propeller cylinder, and the oil tends to congeal, especially if the outside air temperature is low. Consequently, if the propeller is not exercised before takeoff, there is a possibility that the engine may over-speed on takeoff.

An airplane equipped with a constant-speed propeller has better takeoff performance than a similarly powered airplane equipped with a fixed-pitch propeller. This is because with a constant-speed propeller, an airplane can develop its maximum rated horsepower (red line on the tachometer) while motionless. An airplane with a fixed-pitch propeller, on the other hand, needs to accelerate down the runway to increase airspeed and aerodynamically unload the propeller so that rpm and horsepower can steadily build up to their maximum. With a constant-speed propeller, the tachometer reading should come up to within 40 rpm of the red line as soon as full power is applied and remain there for the entire takeoff. Excessive manifold pressure raises the cylinder combustion pressures, resulting in high stresses within the engine. Excessive pressure also produces high-engine temperatures. A combination of high manifold pressure and low rpm can induce damaging detonation. In order to avoid these situations, the following sequence should be followed when making power changes.

- When increasing power, increase the rpm first and then the manifold pressure
- When decreasing power, decrease the manifold pressure first and then decrease the rpm

The cruise power charts in the AFM/POH should be consulted when selecting cruise power settings. Whatever the combinations of rpm and manifold pressure listed in these charts—they have been flight tested and approved by engineers for the respective airframe and engine manufacturer. Therefore, if there are power settings, such as 2,100 rpm and 24 inches manifold pressure in the power chart, they are approved for use. With a constant-speed propeller, a power descent can be made without over-speeding the engine. The system compensates for the increased airspeed of the descent by increasing the propeller blade angles. If the descent is too rapid or is being made from a high altitude, the maximum blade angle limit of the blades is not sufficient to hold the rpm constant. When this occurs, the rpm is responsive to any change in throttle setting.

Although the governor responds quickly to any change in throttle setting, a sudden and large increase in the throttle setting causes a momentary over-speeding of the engine until the blades become adjusted to absorb the increased power. If an emergency demanding full power should arise during approach, the sudden advancing of the throttle causes momentary over-speeding of the engine beyond the rpm for which the governor is adjusted.

Some important points to remember concerning constant speed propeller operation are:

- The red line on the tachometer not only indicates maximum allowable rpm; it also indicates the rpm required to obtain the engine’s rated horsepower.
- A momentary propeller overs-peed may occur when the throttle is advanced rapidly for takeoff. This is usually not serious if the rated rpm is not exceeded by 10 percent for more than 3 seconds.
- The green arc on the tachometer indicates the normal operating range. When developing power in this range, the engine drives the propeller. Below the green arc, however, it is usually the windmilling propeller that powers the engine. Prolonged operation below the green arc can be detrimental to the engine. On takeoffs from low elevation airports, the manifold pressure in inches of mercury may exceed the rpm. This is normal in most cases, but the pilot should always consult the AFM/POH for limitations.
- All power changes should be made smoothly and slowly to avoid over-boosting and/or over-speeding.
