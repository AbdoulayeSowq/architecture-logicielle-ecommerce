package com.lms.university.config;

import com.lms.university.entity.*;
import com.lms.university.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@AllArgsConstructor
public class EPTStructureSeeder implements CommandLineRunner {

    private final CycleRepository cycleRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassRepository classRepository;

    @Override
    public void run(String... args) throws Exception {
        if (cycleRepository.count() == 0) {
            seedEPTStructure();
        }
    }

    private void seedEPTStructure() {
        // 1. Create Cycles
        Cycle troncCommun = new Cycle();
        troncCommun.setName("Tronc Commun");
        troncCommun.setDescription("2 premières années de formation généraliste en sciences fondamentales.");
        troncCommun = cycleRepository.save(troncCommun);

        Cycle cycleIngenieur = new Cycle();
        cycleIngenieur.setName("Cycle Ingénieur");
        cycleIngenieur.setDescription("3 années de formation spécialisée pour le diplôme d'ingénieur.");
        cycleIngenieur = cycleRepository.save(cycleIngenieur);

        // 2. Create Departments (belong to Cycles)
        List<String> departmentNames = Arrays.asList(
            "Génie Civil (GC)",
            "Génie Électromécanique (GEM)",
            "Génie Informatique et Télécommunications (GIT)",
            "Génie Aéronautique (GA)",
            "Génie Industriel (GI)"
        );

        for (String deptName : departmentNames) {
            Department dept = new Department();
            dept.setName(deptName);
            dept.setCycle(cycleIngenieur); // Departments belong to Engineering Cycle
            departmentRepository.save(dept);
        }

        // 3. Create Classes
        // TC1 has no department (common to all)
        com.lms.university.entity.Class tc1 = new com.lms.university.entity.Class();
        tc1.setName("TC1");
        tc1.setDescription("1ère année du tronc commun - formation généraliste (pas de département)");
        tc1.setDepartment(null);
        classRepository.save(tc1);

        // TC2 and DIC classes belong to departments
        List<Department> departments = departmentRepository.findAll();
        List<String> classNames = Arrays.asList("TC2", "DIC1", "DIC2", "DIC3");
        
        for (String className : classNames) {
            for (Department dept : departments) {
                com.lms.university.entity.Class classRef = new com.lms.university.entity.Class();
                classRef.setName(className + " " + dept.getName().substring(dept.getName().indexOf("(") + 1, dept.getName().indexOf(")")));
                classRef.setDescription(className + " - " + dept.getName());
                classRef.setDepartment(dept);
                classRepository.save(classRef);
            }
        }
    }
}
