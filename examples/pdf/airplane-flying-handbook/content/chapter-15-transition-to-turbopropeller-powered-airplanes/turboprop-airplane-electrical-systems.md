---
type: Document
title: Turboprop Airplane Electrical Systems
description: The typical turboprop airplane electrical system is a 28-volt direct current (DC) system, which receives power from one or more batteries and a starter/generator for each engine. The batteries are either lead-acid, nickel-cadmium (NiCad), or Lithium-ion.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf#page=10
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf
    title: 'Chapter 15: Transition to Turbopropeller-Powered Airplanes (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-15-transition-to-turbopropeller-powered-airplanes/turboprop-airplane-electrical-systems
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=10
      note: p. 15-10
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=11
      note: p. 15-11
---
# Turboprop Airplane Electrical Systems

From Chapter 15: Transition to Turbopropeller-Powered Airplanes, pages 15-10 to 15-11 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/16_afh_ch15.pdf#page=10>)).

The typical turboprop airplane electrical system is a 28-volt direct current (DC) system, which receives power from one or more batteries and a starter/generator for each engine. The batteries are either lead-acid, nickel-cadmium (NiCad), or Lithium-ion. When battery voltage is low, its ability to turn the compressor for engine start is greatly diminished, and the possibility of engine damage due to a hot start increases. Therefore, it is essential to check the battery’s condition before every engine start. The different battery types have different operating characteristics depending on the specific aircraft installation and operational environment.

The DC generators used in turboprop airplanes double as starter motors and are called “starter/generators.” The starter/generator uses electrical power to produce mechanical torque to start the engine and then uses the engine’s mechanical torque to produce electrical power after the engine is running. Some of the DC power produced is changed to 28 volt 400 cycle alternating current (AC) power for certain avionic, lighting, and indicator synchronization functions. This is accomplished by an electrical component called an inverter.

The distribution of DC and AC power throughout the system is accomplished through the use of power distribution buses. These “buses” as they are called are actually common terminals from which individual electrical circuits get their power. \[Figure 15-9\]

*Figure 15-9. Typical individual power distribution bus.*

Buses are usually named for what they power (avionics bus, for example) or for where they get their power (right generator bus, battery bus). The distribution of DC and AC power is often divided into functional groups (buses) that give priority to certain equipment during normal and emergency operations. Main buses serve most of the airplane’s electrical equipment. Essential buses feed power to equipment having top priority. \[Figure 15-10\]

*Figure 15-10. Simplified schematic of turboprop airplane electrical system.*

Multiengine turboprop airplanes normally have several power sources—at least one generator per engine and at least one battery for the airplane. The electrical systems are usually designed so that any bus can be energized by any of the power sources. For example, a typical system has a left and right engine generator-powered bus. While these buses are normally isolated, they may be fed from other power sources. However, in the event of a short-circuit, the bus remains isolated. Pilots should refer to the appropriate checklist when an electrical fault occurs.

Power distribution buses are protected from short circuits and other malfunctions by a type of fuse called a current limiter. In the case of excessive current supplied by any power source, the current limiter opens the circuit and thereby isolates that power source and separates the affected bus from the system. If this occurs, pilots should refer to the appropriate checklist.
