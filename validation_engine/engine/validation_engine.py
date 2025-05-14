from typing import Dict, List, Tuple, Optional
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValidationEngine:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self._initialize_rules()
        
    def _initialize_rules(self):
        """Initialize validation rules and thresholds"""
        self.rules = {
            'emission_reduction': {
                'min': 0,
                'max': 1000000,  # 1 million tons
                'required': True
            },
            'project_duration': {
                'min_days': 30,
                'max_days': 3650,  # 10 years
                'required': True
            },
            'data_sources': {
                'min_sources': 2,
                'required_sources': ['sensor', 'satellite'],
                'required': True
            }
        }

    def validate_project(self, project_data: Dict) -> Tuple[bool, str, Dict]:
        """
        Validate a carbon project using both rule-based and ML-based approaches
        
        Args:
            project_data: Dictionary containing project validation data
            
        Returns:
            Tuple of (is_valid, reason, validation_details)
        """
        try:
            # Rule-based validation
            rule_validation, rule_reason, rule_details = self._rule_based_validation(project_data)
            if not rule_validation:
                return False, rule_reason, rule_details

            # ML-based validation
            ml_validation, ml_reason, ml_details = self._ml_based_validation(project_data)
            if not ml_validation:
                return False, ml_reason, ml_details

            # Combine validation results
            validation_details = {
                'rule_validation': rule_details,
                'ml_validation': ml_details,
                'timestamp': datetime.utcnow().isoformat()
            }

            return True, "Project validated successfully", validation_details

        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            return False, f"Validation error: {str(e)}", {}

    def _rule_based_validation(self, project_data: Dict) -> Tuple[bool, str, Dict]:
        """Perform rule-based validation"""
        validation_details = {}
        
        # Validate emission reduction
        if 'estimated_emission_reduction' in project_data:
            reduction = float(project_data['estimated_emission_reduction'])
            if not (self.rules['emission_reduction']['min'] <= reduction <= 
                   self.rules['emission_reduction']['max']):
                return False, "Emission reduction outside acceptable range", validation_details
            validation_details['emission_reduction'] = {'value': reduction, 'valid': True}

        # Validate project duration
        if 'project_start_date' in project_data and 'project_end_date' in project_data:
            start_date = datetime.fromisoformat(project_data['project_start_date'])
            end_date = datetime.fromisoformat(project_data['project_end_date'])
            duration_days = (end_date - start_date).days
            
            if not (self.rules['project_duration']['min_days'] <= duration_days <= 
                   self.rules['project_duration']['max_days']):
                return False, "Project duration outside acceptable range", validation_details
            validation_details['project_duration'] = {'days': duration_days, 'valid': True}

        # Validate data sources
        if 'data_sources' in project_data:
            sources = project_data['data_sources']
            if len(sources) < self.rules['data_sources']['min_sources']:
                return False, "Insufficient data sources", validation_details
            
            missing_required = [src for src in self.rules['data_sources']['required_sources'] 
                              if src not in sources]
            if missing_required:
                return False, f"Missing required data sources: {missing_required}", validation_details
            
            validation_details['data_sources'] = {'sources': sources, 'valid': True}

        return True, "Rule-based validation passed", validation_details

    def _ml_based_validation(self, project_data: Dict) -> Tuple[bool, str, Dict]:
        """Perform ML-based validation using anomaly detection"""
        try:
            # Extract features for ML validation
            features = self._extract_features(project_data)
            
            # Reshape for sklearn
            features_array = np.array(features).reshape(1, -1)
            
            # Predict if the project is an anomaly
            prediction = self.model.fit_predict(features_array)
            
            is_valid = prediction[0] == 1  # 1 means normal, -1 means anomaly
            
            validation_details = {
                'features': features,
                'prediction': int(prediction[0]),
                'is_valid': is_valid
            }
            
            if not is_valid:
                return False, "ML model detected potential anomalies in project data", validation_details
            
            return True, "ML validation passed", validation_details

        except Exception as e:
            logger.error(f"ML validation error: {str(e)}")
            return False, f"ML validation error: {str(e)}", {}

    def _extract_features(self, project_data: Dict) -> List[float]:
        """Extract numerical features for ML validation"""
        features = []
        
        # Emission reduction normalized
        if 'estimated_emission_reduction' in project_data:
            reduction = float(project_data['estimated_emission_reduction'])
            features.append(reduction / self.rules['emission_reduction']['max'])
        
        # Project duration normalized
        if 'project_start_date' in project_data and 'project_end_date' in project_data:
            start_date = datetime.fromisoformat(project_data['project_start_date'])
            end_date = datetime.fromisoformat(project_data['project_end_date'])
            duration_days = (end_date - start_date).days
            features.append(duration_days / self.rules['project_duration']['max_days'])
        
        # Number of data sources normalized
        if 'data_sources' in project_data:
            features.append(len(project_data['data_sources']) / 5)  # Assuming max 5 sources
        
        return features

    def update_model(self, new_training_data: List[Dict]):
        """Update the ML model with new training data"""
        try:
            features_list = [self._extract_features(data) for data in new_training_data]
            features_array = np.array(features_list)
            self.model.fit(features_array)
            logger.info("Model updated successfully")
        except Exception as e:
            logger.error(f"Model update error: {str(e)}")
            raise 