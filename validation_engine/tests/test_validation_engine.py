import pytest
import json
from datetime import datetime
from engine.validation_engine import ValidationEngine

# Load test data
with open('tests/test_data.json', 'r') as f:
    test_data = json.load(f)

@pytest.fixture
def validation_engine():
    return ValidationEngine()

def test_valid_project(validation_engine):
    """Test validation of a valid project"""
    is_valid, reason, details = validation_engine.validate_project(test_data['valid_project'])
    assert is_valid == True
    assert "successfully" in reason
    assert 'rule_validation' in details
    assert 'ml_validation' in details

def test_invalid_project(validation_engine):
    """Test validation of an invalid project"""
    is_valid, reason, details = validation_engine.validate_project(test_data['invalid_project'])
    assert is_valid == False
    assert "outside acceptable range" in reason or "Insufficient data sources" in reason

def test_missing_required_fields(validation_engine):
    """Test validation with missing required fields"""
    invalid_data = test_data['valid_project'].copy()
    del invalid_data['estimated_emission_reduction']
    
    is_valid, reason, details = validation_engine.validate_project(invalid_data)
    assert is_valid == False
    assert "Validation error" in reason

def test_invalid_date_format(validation_engine):
    """Test validation with invalid date format"""
    invalid_data = test_data['valid_project'].copy()
    invalid_data['project_start_date'] = "invalid-date"
    
    is_valid, reason, details = validation_engine.validate_project(invalid_data)
    assert is_valid == False
    assert "Validation error" in reason

def test_model_update(validation_engine):
    """Test updating the ML model with new training data"""
    training_data = [
        test_data['valid_project'],
        test_data['valid_project'].copy()
    ]
    
    # Update model
    validation_engine.update_model(training_data)
    
    # Test validation after update
    is_valid, reason, details = validation_engine.validate_project(test_data['valid_project'])
    assert is_valid == True

def test_rule_based_validation(validation_engine):
    """Test rule-based validation specifically"""
    # Test emission reduction limits
    data = test_data['valid_project'].copy()
    data['estimated_emission_reduction'] = -1000
    is_valid, reason, _ = validation_engine._rule_based_validation(data)
    assert is_valid == False
    assert "outside acceptable range" in reason
    
    # Test project duration
    data = test_data['valid_project'].copy()
    data['project_start_date'] = "2023-01-01T00:00:00Z"
    data['project_end_date'] = "2023-01-15T00:00:00Z"  # Too short
    is_valid, reason, _ = validation_engine._rule_based_validation(data)
    assert is_valid == False
    assert "duration" in reason
    
    # Test data sources
    data = test_data['valid_project'].copy()
    data['data_sources'] = ["sensor"]  # Missing required sources
    is_valid, reason, _ = validation_engine._rule_based_validation(data)
    assert is_valid == False
    assert "sources" in reason

def test_ml_based_validation(validation_engine):
    """Test ML-based validation specifically"""
    # Test with valid data
    is_valid, reason, details = validation_engine._ml_based_validation(test_data['valid_project'])
    assert is_valid == True
    assert "passed" in reason
    assert 'features' in details
    assert 'prediction' in details
    
    # Test with anomalous data
    anomalous_data = test_data['valid_project'].copy()
    anomalous_data['estimated_emission_reduction'] = 1000000  # Very high value
    is_valid, reason, details = validation_engine._ml_based_validation(anomalous_data)
    assert is_valid == False
    assert "anomalies" in reason 