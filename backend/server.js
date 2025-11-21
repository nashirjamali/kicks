import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
if (!ORACLE_PRIVATE_KEY) {
  throw new Error('ORACLE_PRIVATE_KEY must be set in environment variables');
}

const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY);

async function getStravaActivities(accessToken, startTime, endTime) {
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        after: Math.floor(startTime / 1000),
        before: Math.floor(endTime / 1000),
        per_page: 200,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Strava API error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Strava activities');
  }
}

function calculateTotalDistance(activities) {
  return activities.reduce((total, activity) => {
    return total + (activity.distance || 0);
  }, 0);
}

function generateProofMessage(userAddress, totalKm) {
  const packed = ethers.solidityPacked(['address', 'uint256'], [userAddress, totalKm]);
  const messageHash = ethers.keccak256(packed);
  return messageHash;
}

async function signProof(messageHash) {
  const messageBytes = ethers.getBytes(messageHash);
  const signature = await wallet.signMessage(messageBytes);
  return signature;
}

app.post('/api/verify-activity', async (req, res) => {
  try {
    const { userAddress, accessToken, startTime, endTime } = req.body;

    if (!userAddress || !accessToken) {
      return res.status(400).json({ error: 'userAddress and accessToken are required' });
    }

    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: 'Invalid user address' });
    }

    const activities = await getStravaActivities(accessToken, startTime, endTime);
    const totalDistanceMeters = calculateTotalDistance(activities);
    const totalKm = totalDistanceMeters / 1000;

    const totalKmBigInt = BigInt(Math.floor(totalKm * 1000));
    const messageHash = generateProofMessage(userAddress, totalKmBigInt);
    const signature = await signProof(messageHash);

    res.json({
      success: true,
      actualKm: totalKm,
      totalKm: totalKmBigInt.toString(),
      signature,
      activitiesCount: activities.length,
    });
  } catch (error) {
    console.error('Verify activity error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

app.get('/api/challenge-status', async (req, res) => {
  try {
    const { userAddress, accessToken, startTime, endTime } = req.query;

    if (!userAddress || !accessToken) {
      return res.status(400).json({ error: 'userAddress and accessToken are required' });
    }

    const activities = await getStravaActivities(
      accessToken,
      parseInt(startTime),
      parseInt(endTime)
    );
    const totalDistanceMeters = calculateTotalDistance(activities);
    const totalKm = totalDistanceMeters / 1000;

    res.json({
      success: true,
      totalKm,
      activitiesCount: activities.length,
      activities: activities.map((a) => ({
        name: a.name,
        distance: a.distance / 1000,
        type: a.type,
        startDate: a.start_date,
      })),
    });
  } catch (error) {
    console.error('Challenge status error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', oracleAddress: wallet.address });
});

app.listen(PORT, () => {
  console.log(`KICKS Oracle Bridge server running on port ${PORT}`);
  console.log(`Oracle address: ${wallet.address}`);
});

