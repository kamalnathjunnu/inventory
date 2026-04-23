const { Settings } = require('../models');
const { Op } = require('sequelize');

// Get all settings
const getAll = async (req, res) => {
  try {
    const accountId = req.query.accountId || 1; // TODO: Get from auth context
    
    const settings = await Settings.findAll({
      where: { accountId }
    });

    // Transform array to key-value object
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json(settingsObject);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get setting by key
const getByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const accountId = req.query.accountId || 1;

    const setting = await Settings.findOne({
      where: { key, accountId }
    });

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create or update setting
const upsert = async (req, res) => {
  try {
    const { key, value } = req.body;
    const accountId = req.body.accountId || 1;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const [setting, created] = await Settings.upsert({
      key,
      value,
      accountId
    }, {
      returning: true
    });

    res.status(created ? 201 : 200).json({
      key: setting.key,
      value: setting.value,
      created
    });
  } catch (error) {
    console.error('Error upserting setting:', error);
    res.status(500).json({ error: error.message });
  }
};

// Bulk update settings
const bulkUpdate = async (req, res) => {
  try {
    const settings = req.body;
    const accountId = req.body.accountId || req.query.accountId || 1;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }

    const results = [];

    for (const [key, value] of Object.entries(settings)) {
      if (key === 'accountId') continue; // Skip accountId field

      const [setting] = await Settings.upsert({
        key,
        value,
        accountId
      }, {
        returning: true
      });

      results.push({ key: setting.key, value: setting.value });
    }

    res.json({
      success: true,
      updated: results.length,
      settings: results
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete setting
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const accountId = req.query.accountId || 1;

    const deleted = await Settings.destroy({
      where: { key, accountId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get invoice settings specifically
const getInvoiceSettings = async (req, res) => {
  try {
    const accountId = req.query.accountId || 1;

    const settings = await Settings.findAll({
      where: {
        accountId,
        key: {
          [Op.in]: ['invoice_prefix', 'invoice_starting_number']
        }
      }
    });

    const invoiceSettings = {
      invoice_prefix: 'INV',
      invoice_starting_number: 1
    };

    settings.forEach(setting => {
      invoiceSettings[setting.key] = setting.value;
    });

    res.json(invoiceSettings);
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update invoice settings
const updateInvoiceSettings = async (req, res) => {
  try {
    const { invoice_prefix, invoice_starting_number } = req.body;
    const accountId = req.body.accountId || 1;

    const results = [];

    if (invoice_prefix !== undefined) {
      const [setting] = await Settings.upsert({
        key: 'invoice_prefix',
        value: invoice_prefix,
        accountId
      }, {
        returning: true
      });
      results.push(setting);
    }

    if (invoice_starting_number !== undefined) {
      const [setting] = await Settings.upsert({
        key: 'invoice_starting_number',
        value: parseInt(invoice_starting_number),
        accountId
      }, {
        returning: true
      });
      results.push(setting);
    }

    res.json({
      success: true,
      invoice_prefix: results.find(s => s.key === 'invoice_prefix')?.value || 'INV',
      invoice_starting_number: results.find(s => s.key === 'invoice_starting_number')?.value || 1
    });
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getByKey,
  upsert,
  bulkUpdate,
  deleteSetting,
  getInvoiceSettings,
  updateInvoiceSettings
};
