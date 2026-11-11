---
type: Document
title: Turboprop Engine Types
description: One type of turboprop engine is the fixed-shaft constant-speed type, such as the Garrett TPE331. [Figure 15-2] In this type engine, ambient air is directed to the compressor section through the engine inlet.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf#page=2
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf
    title: 'Chapter 15: Transition to Turbopropeller-Powered Airplanes (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-15-transition-to-turbopropeller-powered-airplanes/turboprop-engine-types
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=2
      note: p. 15-2
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=3
      note: p. 15-3
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=4
      note: p. 15-4
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=5
      note: p. 15-5
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=6
      note: p. 15-6
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=7
      note: p. 15-7
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=8
      note: p. 15-8
---
# Turboprop Engine Types

From Chapter 15: Transition to Turbopropeller-Powered Airplanes, pages 15-2 to 15-8 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf#page=2>)).

## Fixed-Shaft

One type of turboprop engine is the fixed-shaft constant-speed type, such as the Garrett TPE331. \[Figure 15-2\] In this type engine, ambient air is directed to the compressor section through the engine inlet. An acceleration/diffusion process in the two-stage compressor increases air pressure and directs it rearward to a combustor. The combustor is made up of a combustion chamber, a transition liner, and a turbine plenum. Atomized fuel is added to the air in the combustion chamber. Air also surrounds the combustion chamber to provide for cooling and insulation of the combustor.

*Figure 15-2. Fixed-shaft turboprop engine.*

The gas mixture is initially ignited by high-energy igniter plugs, and the expanding combustion gases flow to the turbine. The energy of the hot, high-velocity gases is converted to torque on the main shaft by the turbine rotors. The reduction gear converts the high rpm—low torque of the main shaft to low rpm—high torque to drive the accessories and the propeller. The spent gases leaving the turbine are directed to the atmosphere by the exhaust pipe.

Most of the air passing through the engine provides internal cooling. Only about 10 percent of the air that passes through the engine is actually used in the combustion process. Up to approximately 20 percent of the compressed air may be bled off for the purpose of heating, cooling, cabin pressurization, and pneumatic systems. Over half the engine power is devoted to driving the compressor, and it is the compressor that can potentially produce very high drag in the case of a failed, windmilling engine.

In the fixed-shaft constant-speed engine, the engine rpm may be varied within a narrow range of 96 percent to 100 percent. During ground operation, the rpm may be reduced to 70 percent. In flight, the engine operates at a constant speed that is maintained by the governing section of the propeller. Power changes are made by increasing fuel flow and propeller blade angle rather than engine speed. An increase in fuel flow causes an increase in temperature and a corresponding increase in energy available to the turbine. The turbine absorbs more energy and transmits it to the propeller in the form of torque. The increased torque forces the propeller blade angle to be increased to maintain the constant speed. Turbine temperature is a very important factor to be considered in power production. It is directly related to fuel flow and thus to the power produced. It needs to be limited because of strength and durability of the material in the combustion and turbine section. The control system schedules fuel flow to produce specific temperatures and to limit those temperatures so that the temperature tolerances of the combustion and turbine sections are not exceeded. The engine is designed to operate for its entire life at 100 percent. All of its components, such as compressors and turbines, are most efficient when operated at or near the rpm design point.

Powerplant (engine and propeller) control is achieved by means of a power lever and a condition lever for each engine. \[Figure 15-3\] There is no mixture control and/or rpm lever as found on piston-engine airplanes.

On the fixed-shaft constant-speed turboprop engine, the power lever is advanced or retarded to increase or decrease forward thrust. The power lever is also used to provide reverse thrust. The condition lever sets the desired engine rpm within a narrow range between that appropriate for ground operations and flight.

*Figure 15-3. Powerplant controls—fixed-shaft turboprop engine.*

Powerplant instrumentation in a fixed-shaft turboprop engine typically consists of the following basic indicators. \[Figure 15-4\]

1. Torque or horsepower
2. Interturbine temperature (ITT)
3. Fuel flow
4. RPM

*Figure 15-4. Powerplant instrumentation—fixed-shaft turboprop engine.*

Torque developed by the turbine section is measured by a torque sensor. The torque is then reflected on the instrument panel horsepower gauge calibrated in horsepower times 100. ITT is a measurement of the combustion gas temperature between the first and second stages of the turbine section. The gauge is calibrated in degrees Celsius (°C). Propeller rpm is reflected on a tachometer as a percentage of maximum rpm. Normally, a vernier indicator on the gauge dial indicates rpm in 1 percent graduations as well. The fuel flow indicator indicates fuel flow rate in pounds per hour.

Propeller feathering in a fixed-shaft constant-speed turboprop engine is normally accomplished with the condition lever. An engine failure in this type engine, however, results in a serious drag condition due to the large power requirements of the compressor being absorbed by the propeller. This could create a serious airplane control problem in twin-engine airplanes unless the failure is recognized immediately and the affected propeller feathered. For this reason, the fixed-shaft turboprop engine is equipped with negative torque sensing (NTS).

NTS is a condition wherein propeller torque drives the engine, and the propeller is automatically driven to high pitch to reduce drag. The function of the negative torque sensing system is to limit the torque the engine can extract from the propeller during windmilling and thereby prevent large drag forces on the airplane. The NTS system causes a movement of the propeller blades automatically toward their feathered position should the engine suddenly lose power while in flight. The NTS system is an emergency backup system in the event of sudden engine failure. It is not a substitution for the feathering device controlled by the condition lever.

## Split-Shaft/Free Turbine Engine

In a free power-turbine engine, such as the Pratt & Whitney PT-6 engine, the propeller is driven by a separate turbine through reduction gearing. The propeller is not on the same shaft as the basic engine turbine and compressor. \[Figure 15-5\] Unlike the fixedshaft engine, in the split-shaft engine the propeller can be feathered in flight or on the ground with the basic engine still running. The free power-turbine design allows the pilot to select a desired propeller governing rpm, regardless of basic engine rpm.

*Figure 15-5. Split shaft/free turbine engine.*

A typical free power-turbine engine has two independent counter-rotating turbines. One turbine drives the compressor, while the other drives the propeller through a reduction gearbox. The compressor in the basic engine consists of three axial flow compressor stages combined with a single centrifugal compressor stage. The axial and centrifugal stages are assembled on the same shaft and operate as a single unit.

Inlet air enters the engine via a circular plenum near the rear of the engine and flows forward through the successive compressor stages. The flow is directed outward by the centrifugal compressor stage through radial diffusers before entering the combustion chamber, where the flow direction is actually reversed. The gases produced by combustion are once again reversed to expand forward through each turbine stage. After leaving the turbines, the gases are collected in a peripheral exhaust scroll and are discharged to the atmosphere through two exhaust ports near the front of the engine.

A pneumatic fuel control system schedules fuel flow to maintain the power set by the gas generator power lever. Except in the beta range, propeller speed within the governing range remains constant at any selected propeller control lever position through the action of a propeller governor.

The accessory drive at the aft end of the engine provides power to drive fuel pumps, fuel control, oil pumps, a starter/generator, and a tachometer transmitter. At this point, the speed of the drive (N1) is the true speed of the compressor side of the engine, approximately 37,500 rpm.

Powerplant (engine and propeller) operation is achieved by three sets of controls for each engine: the power lever, propeller lever, and condition lever. \[Figure 15-6\] The power lever serves to control engine power in the range from idle through takeoff power. Forward or aft motion of the power lever increases or decreases gas generator rpm (N1) and thereby increases or decreases engine power. The propeller lever is operated conventionally and controls the constant-speed propellers through the primary governor. The propeller rpm range is normally from 1,500 to 1,900. The condition lever controls the flow of fuel to the engine. Like the mixture lever in a piston-powered airplane, the condition lever is located at the far right of the power quadrant. But the condition lever on a turboprop engine is really just an on/off valve for delivering fuel. There are HIGH IDLE and LOW IDLE positions for ground operations, but condition levers have no metering function. Leaning is not required in turbine engines; this function is performed automatically by a dedicated fuel control unit.

*Figure 15-6. Powerplant controls—split-shaft/free turbine engine.*

Engine instruments in a split-shaft/free turbine engine typically consist of the following basic indicators. \[Figure 15-7\]

1. ITT indicator
2. Torquemeter
3. Propeller tachometer
4. N1 (gas generator) tachometer
5. Fuel flow indicator
6. Oil temperature/pressure indicator

*Figure 15-7. Engine instruments—split shaft/free turbine engine.*

The ITT indicator gives an instantaneous reading of engine gas temperature between the compressor turbine and the power turbines. The torquemeter responds to power lever movement and gives an indication in foot-pounds (ft/lb) of the torque being applied to the propeller. Because in the free turbine engine the propeller is not attached physically to the shaft of the gas turbine engine, two tachometers are justified—one for the propeller and one for the gas generator. The propeller tachometer is read directly in revolutions per minute. The N1 or gas generator is read in percent of rpm. In the Pratt & Whitney PT-6 engine, it is based on a figure of 37,000 rpm at 100 percent. Maximum continuous gas generator is limited to 38,100 rpm or 101.5 percent N1.

The ITT indicator and torquemeter are used to set takeoff power. Climb and cruise power are established with the torquemeter and propeller tachometer while observing ITT limits. Gas generator (N1) operation is monitored by the gas generator tachometer. Proper observation and interpretation of these instruments provide an indication of engine performance and condition.
