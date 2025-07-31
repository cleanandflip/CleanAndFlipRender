import { Router } from "express";
import { Logger } from "../utils/logger";
import { isLocalCustomer, getDistanceFromAsheville } from "../../client/src/utils/location";
import type { ParsedAddress } from "../../client/src/components/ui/address-autocomplete";

const router = Router();

// Validate if address is local (within 25 miles of Asheville, NC)
router.post("/validate", async (req, res) => {
  try {
    const address: ParsedAddress = req.body;

    if (!address || !address.fullAddress) {
      return res.status(400).json({
        error: "Invalid address data provided"
      });
    }

    const isLocal = isLocalCustomer(address);
    const distance = getDistanceFromAsheville(address);

    Logger.info(`Address validation: ${address.fullAddress} - Local: ${isLocal}, Distance: ${distance} miles`);

    res.json({
      isLocal,
      distance,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        fullAddress: address.fullAddress,
        coordinates: address.coordinates
      }
    });

  } catch (error) {
    Logger.error("Address validation error:", error);
    res.status(500).json({
      error: "Failed to validate address"
    });
  }
});

// Get distance from Asheville for a given address
router.post("/distance", async (req, res) => {
  try {
    const address: ParsedAddress = req.body;

    if (!address || !address.coordinates) {
      return res.status(400).json({
        error: "Address with coordinates required"
      });
    }

    const distance = getDistanceFromAsheville(address);

    res.json({
      distance,
      isLocal: distance !== null && distance <= 25
    });

  } catch (error) {
    Logger.error("Distance calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate distance"
    });
  }
});

export default router;