/** IoT project hub: subnavigation and section metadata. */
export const iotProject = {
  slug: 'iot',
  title: 'IoT',
  description:
    'Knowledge base for connected devices: ESP32, openHAB, sensors, and home automation experiments.',
  /** Subnav tabs (href paths are base-less; use withBase() when rendering). */
  navLinks: [
    { text: 'Overview', href: '/projects/iot' },
    { text: 'ESP32', href: '/projects/iot/esp32' },
    { text: 'openHAB', href: '/projects/iot/openhab' },
    { text: 'Sensors', href: '/projects/iot/sensors' },
  ],
  sections: [
    {
      slug: 'esp32',
      title: 'ESP32',
      description: 'Firmware, Wi-Fi/BLE, MQTT, and embedded patterns.',
    },
    {
      slug: 'openhab',
      title: 'openHAB',
      description: 'Rules, items, bindings, and smart-home integration.',
    },
    {
      slug: 'sensors',
      title: 'Sensors',
      description: 'Hardware notes, calibration, and data pipelines.',
    },
  ],
} as const

export default iotProject
