import React, { useState } from 'react';
import { FiSearch, FiFilter, FiCompass, FiBell, FiClock, FiUser } from 'react-icons/fi';
import { FaBus, FaCar, FaBicycle, FaWheelchair, FaTruck } from 'react-icons/fa';

export default function App() {
  const [mode, setMode] = useState('bus');
  const modes = [
    { key: 'bus', icon: <FaBus /> },
    { key: 'car', icon: <FaCar /> },
    { key: 'bike', icon: <FaBicycle /> },
    { key: 'wheel', icon: <FaWheelchair /> },
    { key: 'truck', icon: <FaTruck /> },
  ];

  const styles = {
    container: {
      position: 'relative',
      width: '100vw',
      height: '100vh',
      fontFamily: 'sans-serif',
      background: '#F0F0F5',
      display: 'flex',
      flexDirection: 'column',
    },
    topBar: { display: 'flex', padding: '16px' },
    searchBox: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      background: '#FFFFFF',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      padding: '4px 8px',
    },
    input: { border: 'none', flex: 1, fontSize: '14px', outline: 'none' },
    iconBtn: {
      marginLeft: '8px',
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      cursor: 'pointer',
    },
    mapPlaceholder: {
      flex: 1,
      margin: '0 16px',
      background: '#EDEDED',
      borderRadius: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#888888',
      fontSize: '16px',
    },
    modeBar: { display: 'flex', justifyContent: 'space-between', padding: '16px' },
    modeBtn: key => ({
      background: key === mode ? '#E3E7FF' : '#F0F0F5',
      border: 'none',
      borderRadius: '12px',
      padding: '12px',
      fontSize: '18px',
      color: key === mode ? '#3751FF' : '#888888',
      cursor: 'pointer',
    }),
    locateBtn: {
      position: 'absolute',
      right: '16px',
      top: '65%',
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '50%',
      padding: '12px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      cursor: 'pointer',
    },
    bottomNav: {
      display: 'flex',
      justifyContent: 'space-around',
      background: '#FFFFFF',
      padding: '12px 0',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      boxShadow: '0 -2px 6px rgba(0,0,0,0.1)',
    },
    navBtn: active => ({
      background: 'transparent',
      border: 'none',
      fontSize: '24px',
      color: active ? '#3751FF' : '#888888',
      cursor: 'pointer',
    }),
  };

  return (
    <div style={styles.container}>
      {/* 顶部搜索区 */}
      <div style={styles.topBar}>
        <div style={styles.searchBox}>
          <FiSearch style={{ marginRight: '8px', color: '#888888' }} />
          <input style={styles.input} placeholder="搜索地点" />
        </div>
        <button style={styles.iconBtn}><FiFilter /></button>
      </div>
      {/* 地图占位 */}
      <div style={styles.mapPlaceholder}>地图加载中...</div>
      {/* 模式切换 */}
      <div style={styles.modeBar}>
        {modes.map(item => (
          <button key={item.key} style={styles.modeBtn(item.key)} onClick={() => setMode(item.key)}>
            {item.icon}
          </button>
        ))}
      </div>
      {/* 定位按钮 */}
      <button style={styles.locateBtn}><FiCompass /></button>
      {/* 底部导航 */}
      <div style={styles.bottomNav}>
        {['compass', 'bell', 'clock', 'user'].map((icon, idx) => {
          const iconsMap = { compass: <FiCompass />, bell: <FiBell />, clock: <FiClock />, user: <FiUser /> };
          return <button key={icon} style={styles.navBtn(idx === 0)}>{iconsMap[icon]}</button>;
        })}
      </div>
    </div>
  );
}