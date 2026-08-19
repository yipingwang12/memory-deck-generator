"""A tiny canonical MEI theme, shared by the theme tests.

Inline rather than read from ``cache/mtd``: the MTD corpus is a 2.6 GB gitignored download,
so a suite that needed it would pass only on a machine that happened to have it. Six notes is
enough to exercise every corruption type — two measures, an unprinted alteration on n4
(``accid.ges``, the respelling trap), and a pair of equal notes in each measure for rhythm.
"""

MEI = '''<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="6.0-dev">
   <music>
      <body>
         <mdiv>
            <score>
               <scoreDef>
                  <staffGrp>
                     <staffDef xml:id="P1" n="1" lines="5" ppq="2">
                        <clef shape="G" line="2" />
                        <keySig sig="0" />
                        <meterSig count="4" unit="4" />
                     </staffDef>
                  </staffGrp>
               </scoreDef>
               <section>
                  <measure n="1">
                     <staff n="1">
                        <layer n="1">
                           <note xml:id="n1" dur.ppq="2" dur="4" oct="5" pname="c" />
                           <note xml:id="n2" dur.ppq="2" dur="4" oct="5" pname="d" />
                           <note xml:id="n3" dur.ppq="2" dur="4" oct="5" pname="e" />
                           <note xml:id="n4" dur.ppq="2" dur="4" oct="5" pname="f" accid.ges="s" />
                        </layer>
                     </staff>
                  </measure>
                  <measure n="2">
                     <staff n="1">
                        <layer n="1">
                           <note xml:id="n5" dur.ppq="4" dur="2" oct="5" pname="g" />
                           <note xml:id="n6" dur.ppq="4" dur="2" oct="5" pname="a" />
                        </layer>
                     </staff>
                  </measure>
               </section>
            </score>
         </mdiv>
      </body>
   </music>
</mei>'''

# The same theme as MusicXML, for the conversion path.
MUSICXML = '''<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.0">
  <part-list><score-part id="P1"><part-name>T</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>2</divisions><key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef></attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note>
      <note><pitch><step>F</step><alter>1</alter><octave>5</octave></pitch><duration>2</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>4</duration><type>half</type></note>
      <note><pitch><step>A</step><octave>5</octave></pitch><duration>4</duration><type>half</type></note>
    </measure>
  </part>
</score-partwise>'''
