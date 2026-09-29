---
type: Document
title: Turbocharging
description: The turbocharged engine allows the pilot to maintain sufficient cruise power at high altitudes where there is less drag, which means faster true airspeeds and increased range with fuel economy.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf#page=9
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf
    title: 'Chapter 12: Transition to Complex Airplanes (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-12-transition-to-complex-airplanes/turbocharging
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=9
      note: p. 12-9
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=10
      note: p. 12-10
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=11
      note: p. 12-11
---
# Turbocharging

From Chapter 12: Transition to Complex Airplanes, pages 12-9 to 12-11 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/13_afh_ch12.pdf#page=9>)).

The turbocharged engine allows the pilot to maintain sufficient cruise power at high altitudes where there is less drag, which means faster true airspeeds and increased range with fuel economy. At the same time, the powerplant has flexibility and can be flown at a low altitude without the increased fuel consumption of a turbine engine. When attached to the standard powerplant, the turbocharger does not take any horsepower from the engine to operate; it is relatively simple mechanically, and some models can pressurize the cabin as well.

The turbocharger is an exhaust-driven device that raises the pressure and density of the induction air delivered to the engine. It consists of two separate components: a compressor and a turbine connected by a common shaft. The compressor supplies pressurized air to the engine for high-altitude operation. The compressor and its housing are between the ambient air intake and the induction air manifold. The turbine and its housing are part of the exhaust system and utilize the flow of exhaust gases to drive the compressor. \[Figure 12-9\]

*Figure 12-9. Turbocharging system.*

The turbine has the capability of producing manifold pressure in excess of the maximum allowable for the particular engine. In order not to exceed the maximum allowable manifold pressure, a bypass or waste gate is used so that some of the exhaust is diverted overboard before it passes through the turbine.

The position of the waste gate regulates the output of the turbine and therefore, the compressed air available to the engine. When the waste gate is closed, all of the exhaust gases pass through and drive the turbine. As the waste gate opens, some of the exhaust gases are routed around the turbine through the exhaust bypass and overboard through the exhaust pipe.

The waste gate actuator is a spring-loaded piston operated by engine oil pressure. The actuator, which adjusts the waste gate position, is connected to the waste gate by a mechanical linkage.

The control center of the turbocharger system is the pressure controller. This device simplifies turbocharging to one control: the throttle. Once the desired manifold pressure is set, virtually no throttle adjustment is required with changes in altitude. The controller senses compressor discharge requirements for various altitudes and controls the oil pressure to the waste gate actuator, which adjusts the waste gate accordingly. Thus the turbocharger will maintain the manifold pressure called for by the throttle setting.

## Ground Boosting Versus Altitude Turbocharging

Altitude turbocharging (sometimes called “normalizing”) is accomplished by using a turbocharger that maintains maximum allowable sea level manifold pressure (normally 29–30 "Hg) up to a certain altitude. This altitude is specified by the airplane manufacturer and is referred to as the airplane’s critical altitude. Above the critical altitude, the manifold pressure decreases as additional altitude is gained. Ground boosting, on the other hand, is an application of turbocharging where more than the standard 29 inches of manifold pressure is used in flight. In various airplanes using ground boosting, takeoff manifold pressures may go as high as 45 "Hg.

Although a sea-level manifold pressure setting and maximum rpm can be maintained up to the critical altitude, the engine may not be developing sea-level power. Because the turbocharged induction air is heated by compression, lower induction air density causes a loss of engine power. Maintaining the equivalent horsepower output requires a somewhat higher manifold pressure at a given altitude than if the induction air were not compressed and heated by turbocharging. If, on the other hand, the system incorporates an automatic density controller, which automatically positions the waste gate so as to maintain constant air density to the engine, a near equivalent to sea-level horsepower output results.

## Operating Characteristics

First and foremost, all movements of the power controls on turbocharged engines should be slow and smooth. Aggressive or abrupt throttle movements increase the possibility of over-boosting. Carefully monitor engine indications when making power changes.

When the waste gate is open, the turbocharged engine reacts the same as a normally aspirated engine when the rpm is varied. That is, when the rpm is increased, the manifold pressure decreases slightly. When the engine rpm is decreased, the manifold pressure increases slightly. However, when the waste gate is closed, manifold pressure variation with engine rpm is just the opposite of the normally aspirated engine. An increase in engine rpm results in an increase in manifold pressure, and a decrease in engine rpm results in a decrease in manifold pressure.

Above the critical altitude, where the waste gate is closed, any change in airspeed results in a corresponding change in manifold pressure. This is true because the increase in ram air pressure with an increase in airspeed is magnified by the compressor resulting in an increase in manifold pressure. The increase in manifold pressure creates a higher mass flow through the engine, causing higher turbine speeds and thus further increasing manifold pressure.

When running at high altitudes, aviation gasoline tends to vaporize prior to reaching the cylinder. If this occurs in the portion of the fuel system between the fuel tank and the engine-driven fuel pump, an auxiliary positive pressure pump may be needed in the tank. Since engine-driven pumps pull fuel, they are easily vapor locked. A boost pump provides positive pressure, which pushes the fuel and reduces the tendency to vaporize.

## Heat Management

Turbocharged engines should be thoughtfully and carefully operated with continuous monitoring of pressures and temperatures. There are two temperatures that are especially important—turbine inlet temperature (TIT) or, in some installations, exhaust gas temperature (EGT) and cylinder head temperature. TIT or EGT limits are set to protect the elements in the hot section of the turbocharger, while cylinder head temperature limits protect the engine’s internal parts.

Due to the heat of compression of the induction air, a turbocharged engine runs at higher operating temperatures than a nonturbocharged engine. Because turbocharged engines operate at high altitudes, their environment is less efficient for cooling. At altitude, the air is less dense and, therefore, cools less efficiently. Also, the less dense air causes the compressor to work harder. Compressor turbine speeds can reach 80,000–100,000 rpm, adding to the overall engine operating temperatures. Turbocharged engines are also operated at higher power settings a greater portion of the time.

High heat is detrimental to piston engine operation. Its cumulative effects can lead to piston, ring, and cylinder head failure and place thermal stress on other operating components. Excessive cylinder head temperature can lead to detonation, which in turn can cause catastrophic engine failure. Turbocharged engines are especially heat sensitive. The key to turbocharger operation is effective heat management.

Monitor the condition of a turbocharged engine with manifold pressure gauge, tachometer, exhaust gas temperature/turbine inlet temperature gauge, and cylinder head temperature gauge. Manage the “heat system” with the throttle, propeller rpm, mixture, and cowl flaps. At any given cruise power, the mixture is the most influential control over the exhaust gas/TIT. The throttle regulates total fuel flow, but the mixture governs the fuel-to-air ratio. The mixture, therefore, controls temperature.

Exceeding temperature limits in an after-takeoff climb is usually not a problem since a full rich mixture cools with excess fuel. At cruise, power is normally reduced and mixture adjusted accordingly. Under cruise conditions, monitor temperature limits closely because that is when the temperatures are most likely to reach the maximum, even though the engine is producing less power. Overheating in an en route climb, however, may require fully open cowl flaps and a higher airspeed.

Since turbocharged engines operate hotter at altitude than normally aspirated engines, they are more prone to damage from cooling stress. Gradual reductions in power and careful monitoring of temperatures are essential in the descent phase. Extending the landing gear during the descent may help control the airspeed while maintaining a higher engine power setting. This allows the pilot to reduce power in small increments which allows the engine to cool slowly. It may also be necessary to lean the mixture slightly to eliminate roughness at the lower power settings.

## Turbocharger Failure

Because of the high temperatures and pressures produced in the turbine exhaust system, any malfunction of the turbocharger should be treated with extreme caution. In all cases of turbocharger operation, the manufacturer’s recommended procedures should be followed. This is especially so in the case of turbocharger malfunction. However, in those instances where the manufacturer’s procedures do not adequately describe the actions to be taken in the event of a turbocharger failure, the following procedures should be used.

## Over-Boost Condition

If an excessive rise in manifold pressure occurs during normal advancement of the throttle (possibly owing to faulty operation of the waste gate):

- Immediately retard the throttle smoothly to limit the manifold pressure below the maximum for the rpm and mixture setting.
- Operate the engine in such a manner as to avoid a further over-boost condition.

## Low Manifold Pressure

Although this condition may be caused by a minor fault, it is quite possible that a serious exhaust leak has occurred creating a potentially hazardous situation:

- Shut down the engine in accordance with the recommended engine failure procedures, unless a greater emergency exists that warrants continued engine operation.
- If continuing to operate the engine, use the lowest power setting demanded by the situation and land as soon as practicable.

It is very important to ensure that corrective maintenance is undertaken following any turbocharger malfunction.
