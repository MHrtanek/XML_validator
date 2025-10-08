export const SAMPLE_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:integer"/>
      </xs:sequence>
      <xs:attribute name="id" type="xs:positiveInteger" use="required"/>
    </xs:complexType>
  </xs:element>
 </xs:schema>`;

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<person id="1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="person.xsd">
  <name>Alice</name>
  <age>30</age>
 </person>`;


