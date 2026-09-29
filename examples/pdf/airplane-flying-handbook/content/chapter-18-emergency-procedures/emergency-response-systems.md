---
type: Document
title: Emergency Response Systems
description: Airplanes may have installed systems that provide alternatives in certain emergency situations.
resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/19_afh_ch18.pdf#page=22
sources:
  - id: pdf
    resource: https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/19_afh_ch18.pdf
    title: 'Chapter 18: Emergency Procedures (PDF)'
moca:
  concepts:
    - iri: https://example.com/moca/pdf/airplane-flying-handbook#chapter-18-emergency-procedures/emergency-response-systems
      role: primary
  evidence:
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=22
      note: p. 18-22
    - source: pdf
      selector:
        type: FragmentSelector
        conformsTo: http://tools.ietf.org/rfc/rfc3778
        value: page=23
      note: p. 18-23
---
# Emergency Response Systems

From Chapter 18: Emergency Procedures, pages 18-22 to 18-23 ([PDF](<https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/19_afh_ch18.pdf#page=22>)).

Airplanes may have installed systems that provide alternatives in certain emergency situations. For example, ballistic parachute systems, if installed, may be deployed in an emergency allowing an airplane to descend slowly enough toward the ground such that occupants usually survive the resulting impact with minor or no injuries. Airplanes may also have an Emergency Autoland (EAL) system, which can take over control of the aircraft when necessary for a safe outcome.

## Ballistic Parachutes

Deployment of an airplane ballistic parachute system results in the loss of the airframe, but deploying such systems within an acceptable flight regime prevents injuries and saves lives. Pilots need to understand and follow the procedures for arming and disarming these systems before and after flight, and understand the conditions under which the system would be deployed. For example, a catastrophic loss of controllability due to a collision or mechanical failure, actual loss of control, or pilot incapacitation would qualify. Pilots should brief passengers with access to any deployment mechanism regarding the conditions for a safe deployment. Generally, the passenger would deploy the system only if the pilot were incapacitated. At a minimum, the pilot should also brief the passengers regarding the basic sequence of steps for deployment. Pilots should study the information provided by manufacturers and suppliers of these systems and follow the guidance provided.

The system design may include airplane components designed to absorb the forces of vertical impact. The design of landing gear and seats maximize the protection afforded to the occupants and extend the time over which impact forces are absorbed. Once on the ground, there are hazards associated with a deployed parachute and the effect of surface winds, and the occupants should know the procedures for evacuation.

## Autoland

If the EAL senses erratic flying, it stabilizes the aircraft, and checks for pilot responsiveness. Without further input, the EAL initiates an emergency descent. Without pilot responsiveness after an emergency descent, EAL initiates the process for an automated landing. The system also allows for manual activation by a pilot or a passenger.

Once activated, the EAL system transmits automated radio broadcasts on the aircraft’s last selected frequency and on Guard (121.5 MHz) to alert controllers or pilots in the area of the EAL aircraft’s imminent arrival to the selected runway. The system repeatedly transmits the call sign and intention to divert to a particular airport and runway using a recognizable non-human synthesized voice. Additionally, EAL sets the transponder to squawk 7700 to indicate an emergency. After the initial broadcast, the system pauses for 25 seconds to allow air traffic control (ATC) to communicate with potential conflicting traffic. Once the EAL aircraft is within 12 miles of the selected runway and at or below 12,000 feet MSL, it broadcasts on the tower frequency or Common Traffic Advisory Frequency (CTAF), and continues to broadcast its position via ADS-B. It announces its call sign,“pilot incapacitation,” its position relative to the destination airport, gives the airport and airport identifier, and the time to landing on a specific runway at that airport. The system makes a similar “one-minute out” broadcast prior to landing.

The EAL system selects a suitable landing airfield based on several factors. These factors include weather, wind, runway length, and towered/non-towered airport status. EAL only considers airports with an area navigation (RNAV) or Global Positioning System (GPS) approach, selects towered airports over non-towered airports where possible, and uses runway requirements that depend on the aircraft type. EAL systems also utilize obstacle and a terrain databases. If the system loses GPS coverage, the airplane continues straight flight without attempting to land until GPS coverage resumes.

Currently EAL system capabilities do not include detecting and avoiding other aircraft; receiving or reacting to ATC instructions or Notices to Airmen (NOTAMs); avoiding military operations areas (MOAs), special use airspace (SUA), Restricted Areas, or Temporary Flight Restrictions (TFRs); or turning on aircraft lights.
