use crate::models::{Employee, Group, ShiftSchedule, ShiftType};
use chrono::{DateTime, Duration, Utc};
use std::collections::HashMap;

pub struct ShiftManager {
    groups: HashMap<String, Group>,
    employees: HashMap<String, Employee>,
    schedules: Vec<ShiftSchedule>,
}

impl ShiftManager {
    pub fn new() -> Self {
        Self {
            groups: HashMap::new(),
            employees: HashMap::new(),
            schedules: Vec::new(),
        }
    }

    pub fn generate_schedule(&mut self, start_date: DateTime<Utc>, days: i64) -> Vec<ShiftSchedule> {
        let mut schedules = Vec::new();
        let groups: Vec<Group> = self.groups.values().cloned().collect();
        
        for day in 0..days {
            let current_date = start_date + Duration::days(day);
            
            for (index, group) in groups.iter().enumerate() {
                let shift_type = match (index + day as usize) % 3 {
                    0 => ShiftType::Morning,
                    1 => ShiftType::Night,
                    _ => ShiftType::Rest,
                };

                schedules.push(ShiftSchedule {
                    id: uuid::Uuid::new_v4().to_string(),
                    date: current_date,
                    group_id: group.id.clone(),
                    shift_type,
                });
            }
        }

        self.schedules = schedules.clone();
        schedules
    }

    pub fn validate_group_change(&self, employee_id: &str, new_group_id: &str) -> Result<(), String> {
        let employee = self.employees.get(employee_id)
            .ok_or("Personel bulunamadı")?;
            
        let new_group = self.groups.get(new_group_id)
            .ok_or("Hedef grup bulunamadı")?;
            
        // Vardiya değişikliği kontrolü
        let current_group = self.groups.get(&employee.group_id);
        if let Some(current_group) = current_group {
            if current_group.current_shift != new_group.current_shift {
                return Err("Farklı vardiyada çalışan gruba transfer yapılamaz".to_string());
            }
        }

        Ok(())
    }

    pub fn get_all_employees(&self) -> Vec<Employee> {
        self.employees.values().cloned().collect()
    }

    pub fn get_all_groups(&self) -> Vec<Group> {
        self.groups.values().cloned().collect()
    }

    pub fn get_current_shifts(&self) -> HashMap<String, ShiftType> {
        self.groups
            .iter()
            .map(|(id, group)| (id.clone(), group.current_shift.clone()))
            .collect()
    }

    pub fn add_employee(&mut self, employee: Employee) -> Result<(), String> {
        if self.employees.contains_key(&employee.id) {
            return Err("Bu ID'ye sahip personel zaten mevcut".to_string());
        }
        self.employees.insert(employee.id.clone(), employee);
        Ok(())
    }

    pub fn add_group(&mut self, group: Group) -> Result<(), String> {
        if self.groups.contains_key(&group.id) {
            return Err("Bu ID'ye sahip grup zaten mevcut".to_string());
        }
        self.groups.insert(group.id.clone(), group);
        Ok(())
    }

    pub fn update_employee_group(&mut self, employee_id: &str, new_group_id: &str) -> Result<(), String> {
        let employee = self.employees.get_mut(employee_id)
            .ok_or("Personel bulunamadı")?;
        employee.group_id = new_group_id.to_string();
        Ok(())
    }
} 