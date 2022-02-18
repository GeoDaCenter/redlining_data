import Head from 'next/head'
import { useRouter } from 'next/router'
import styles from '../styles/Map.module.css'
import MapComponent from '../components/MapComponent'
import { useEffect, useState } from 'react';
import { ListBox } from '@adobe/react-spectrum';
import { Item } from '@adobe/react-spectrum';
import { WebMercatorViewport } from '@deck.gl/core';
import { fitBounds } from "@math.gl/web-mercator";
import Legend from '../components/Legend';
import Icon from '../components/Icon';
import {
  LayerList,
  DATA_URL,
  bins,
  attributions,
} from '../map.config'
import JSONInput from 'react-json-editor-ajrm';
import locale    from 'react-json-editor-ajrm/locale/en';

export default function Home() {
  const router = useRouter()
  const { query } = router;
  const [activeLayers, setLayers] = useState(query.l ? query.l.split('|') : ['slavery'])
  const [hasPanned, setHasPanned] = useState(false)
  const [availableLayers, setAvailableLayers] = useState(LayerList)
  const [portal, setPortal] = useState(null)
  const [currBins, setCurrBins] = useState(bins)
  const [tempBins, setTempBins] = useState(bins)
  const [changeBins, setChangeBins] = useState(false)
  useEffect(() => {
    setTempBins(currBins)
  },[JSON.stringify(currBins)])

  const [view, setView] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1,
    pitch: 0,
    bearing: 0,
  })

  useEffect(() => {
    if (typeof window !== undefined && !hasPanned) {
      const viewport = fitBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        bounds: [[-125.109215,25.043926],[-66.925621,49.295128]],
        padding:50
      });
      
      setView({ ...viewport, pitch: 0, bearing: 0 });
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const initialViewBounds = query.x0 && query.x1 && query.y0 && query.y1 ? [
      [
        +query.x0, +query.y0
      ],
      [
        +query.x1, +query.y1
      ],
    ] : [
      [-125.109215,25.043926],[-66.925621,49.295128]
    ]
    if (typeof window !== undefined && !hasPanned) {
      const viewport = fitBounds({
        width: window.innerWidth,
        height: window.innerHeight,
        bounds: initialViewBounds,
      });

      setHasPanned(true)
      setView({ ...viewport, pitch: 0, bearing: 0 });
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.x0]);


  useEffect(() => {
    const viewport = new WebMercatorViewport(view);
    const [x0, y0] = viewport.unproject([0, 0]);
    const [x1, y1] = viewport.unproject([viewport.width, viewport.height]);

    router.push({
      pathname: '/map',
      query: {
        l: activeLayers.join('|').replace(/\s/g, ''),
        x0: Math.round(x0 * 100) / 100,
        x1: Math.round(x1 * 100) / 100,
        y0: Math.round(y0 * 100) / 100,
        y1: Math.round(y1 * 100) / 100
      },
    }) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeLayers), JSON.stringify(view)])
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Map:: Legacy of American Apartheid</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>
          The Geospatial Legacy of American Apartheid
        </h1>
      </header>
      <section className={styles.sidebar}>
        <h3>Map Layers</h3>
        <ListBox
          selectionMode="multiple"
          aria-label="Choose map layers"
          width="size-2400"
          items={availableLayers}
          defaultSelectedKeys={activeLayers}
          onSelectionChange={selected => setLayers(Array.from(selected))}
        >
          {(item) => <Item>{item.label}</Item>}
        </ListBox>
        <button onClick={() => setChangeBins(prev => !prev)}>Change Bins</button>
      </section>
      <section className={styles.map}>
        <MapComponent {...{ activeLayers, view, setView, bins: currBins, DATA_URL, setPortal }} />
      </section>
      <section className={styles.bottomRight}>
        <div className={styles.legend}>
          {activeLayers.map(layer => <Legend key={`Legend-${layer}`} {...{ ...currBins[layer], title: LayerList.find(f => f.id === layer)?.label }} />)}
        </div>
        <div className={styles.attributions}>
          {activeLayers.map(layer => <span key={`attribution-${layer}`}>{attributions[layer] || ''}<br /></span>)}
          Map Data: © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> © <a href="https://www.openstreetmap.org/about/" target="_blank" rel="noreferrer">OpenStreetMap</a> <a href="https://www.mapbox.com/contribute/#/?q=&l=2.1234%2F32.9547%2F11" target="_blank" rel="noreferrer">Improve this map</a>
        </div>
      </section>
      {!!portal && <section className={styles.portal}>
        <a href={portal} target="_blank" rel="noreferrer"><Icon iconName="flag"/> Some remote pages may not work in this panel, click here to open in a new tab.</a>
        <button className={styles.closePortal} onClick={() => setPortal(null)}>Close this panel</button>
        <iframe width="100%" height="100%" src={portal} frameBorder="0" allowFullScreen={false} />
      </section>}
      {!!changeBins && <section className={styles.jsonPortal}>
          <JSONInput
            id          = 'jsonEditr'
            placeholder = { tempBins }
            onChange = { ({jsObject}) => setTempBins(jsObject)}
            width = '100%'
            height = '100%'
        />
        <button onClick={() => setCurrBins(tempBins)}>commit changes</button>
        <button onClick={() => setChangeBins(false)}>close</button>
        </section>}
    </div>
  )
}
