// components/TopBar.jsx
'use client';

import { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import Axios from '@/lib/Axios';

const TopBar = ({ content }) => {
  const [open, setOpen] = useState(
    typeof window !== 'undefined' &&
      sessionStorage.getItem('topCapitalAcademyTopBar') === 'false'
      ? false
      : true
  );

  const { enqueueSnackbar } = useSnackbar();
  const [topbarContent, setTopbarContent] = useState(content ||
    'Welcome Dear Student! May Your Journey Be Filled With Joy & Success'
  );

  useEffect(() => {
    const fetchTopbar = async () => {
      try {
        const res = await Axios.get('/api/v1/common/topbar');
        setTopbarContent(res?.data?.tcontent);
      } catch (error) {
        console.error('Fetching topbar content failed:', error);
      }
    };

    fetchTopbar();
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('topCapitalAcademyTopBar', 'false');
    setOpen(false);
  };

  return (
    <>
      {open && (
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: 'linear-gradient(to right, #1757ab, #e260a2)',
            height: 38,
            justifyContent: 'center',
          }}
        >
          <Toolbar sx={{ px: 2 }}>
            <Typography variant="body2" sx={{ flexGrow: 1, display: 'flex', items: 'center', width: '100%', color: '#fff' }}>
              <marquee className="marquee-text  text-lg h-full" scrollamount="4">
                {topbarContent}
              </marquee>
            </Typography>

            <IconButton
              size="small"
              sx={{
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              onClick={handleClose}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
    </>
  );
};

export default TopBar;
